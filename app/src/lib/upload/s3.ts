import { writable } from "svelte/store";
import type { Writable } from "svelte/store";

type Upload = {
    uploadId: string | null,
    urls: string[],
    partSize: number,
};

type UploadTask = {
    key: string,
    name: string,
    size: number,
    transferred: Writable<number>,
    task: Promise<void>,
}

async function prepare(key: string, size: number, endpoint: string): Promise<Upload> {
    const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'omit',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "operation": "prepare",
            "body": { key, size },
        })
    });
    return response.json();
}

function slicePart(buffer: ArrayBuffer, index: number, partSize: number): ArrayBuffer {
    return buffer.slice(index * partSize, (index + 1) * partSize);
}

function uploadPart(buffer: ArrayBuffer, url: string, headers: Headers): Promise<Response> {
    return fetch(url, {
        method: 'PUT',
        body: buffer,
        headers,
    });
}

async function complete(key: string, upload: Upload, responses: Response[], endpoint: string) {
    if (upload.uploadId === null) return;

    const etags = responses.map(response => response.headers.get('ETag'));
    await fetch(endpoint, {
        method: 'POST',
        credentials: 'omit',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            "operation": "complete",
            "body": { key, uploadId: upload.uploadId, etags },
        })
    });
}

async function transfer(
    file: File,
    upload: Upload,
    transferred: Writable<number>,
): Promise<Response[]> {
    return new Promise(resolve => {
        const reader = new FileReader();

        reader.onload = async () => {
            const tasks = upload.urls.map(async (url, index) => {
                const buffer = reader.result as ArrayBuffer;
                const body = slicePart(buffer, index, upload.partSize);
                const headers = new Headers({
                    'Content-Type': file.type,
                    'Content-Length': body.byteLength.toString(),
                });
                const response = await uploadPart(body, url, headers);

                transferred.update(n => n + body.byteLength);
                return response
            });

            resolve(Promise.all(tasks));
        };

        reader.readAsArrayBuffer(file);
    });
}

async function upload(key: string, file: File, endpoint: string, transferred: Writable<number>) {
    const upload = await prepare(key, file.size, endpoint);
    console.log(upload);
    const responses = await transfer(file, upload, transferred);
    if (upload.uploadId !== null) {
        await complete(key, upload, responses, endpoint)
    }
}


export function createUploadTask(file: File, prefix: string, endpoint: string = "/api/upload"): UploadTask {
    const key = `${prefix}/${file.name}`;
    const transferred = writable(0);
    const task = upload(key, file, endpoint, transferred);
    return { key, name: file.name, size: file.size, transferred, task };
}
