import * as THREE from 'three';

const tempVector3A = new THREE.Vector3();
const tempVector3B = new THREE.Vector3();
const tempVector4A = new THREE.Vector4();
const tempVector4B = new THREE.Vector4();
const tempQuaternion4A = new THREE.Quaternion();
const tempQuaternion4B = new THREE.Quaternion();

let fbf;
let tbf;

export class SplatBuffer {

    static CenterComponentCount = 3;
    static ScaleComponentCount = 3;
    static RotationComponentCount = 4;
    static ColorComponentCount = 4;

    static CompressionLevels = {
        0: {
            BytesPerCenter: 12,
            BytesPerScale: 12,
            BytesPerColor: 4,
            BytesPerRotation: 16,
            ScaleRange: 1
        },
        1: {
            BytesPerCenter: 6,
            BytesPerScale: 6,
            BytesPerColor: 4,
            BytesPerRotation: 8,
            ScaleRange: 32767
        }
    };

    static CovarianceSizeFloats = 6;
    static CovarianceSizeBytes = 24;

    static HeaderSizeBytes = 1024;

    constructor(bufferData) {
        this.headerBufferData = new ArrayBuffer(SplatBuffer.HeaderSizeBytes);
        this.headerArrayUint8 = new Uint8Array(this.headerBufferData);
        this.headerArrayUint32 = new Uint32Array(this.headerBufferData);
        this.headerArrayFloat32 = new Float32Array(this.headerBufferData);
        this.headerArrayUint8.set(new Uint8Array(bufferData, 0, SplatBuffer.HeaderSizeBytes));
        this.versionMajor = this.headerArrayUint8[0];
        this.versionMinor = this.headerArrayUint8[1];
        this.headerExtraK = this.headerArrayUint8[2];
        this.compressionLevel = this.headerArrayUint8[3];
        this.splatCount = this.headerArrayUint32[1];
        this.bucketSize = this.headerArrayUint32[2];
        this.bucketCount = this.headerArrayUint32[3];
        this.bucketBlockSize = this.headerArrayFloat32[4];
        this.halfBucketBlockSize = this.bucketBlockSize / 2.0;
        this.bytesPerBucket = this.headerArrayUint32[5];
        this.compressionScaleRange = this.headerArrayUint32[6] || SplatBuffer.CompressionLevels[this.compressionLevel].ScaleRange;
        this.compressionScaleFactor = this.halfBucketBlockSize / this.compressionScaleRange;

        const dataBufferSizeBytes = bufferData.byteLength - SplatBuffer.HeaderSizeBytes;
        this.splatBufferData = new ArrayBuffer(dataBufferSizeBytes);
        new Uint8Array(this.splatBufferData).set(new Uint8Array(bufferData, SplatBuffer.HeaderSizeBytes, dataBufferSizeBytes));

        this.bytesPerCenter = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerCenter;
        this.bytesPerScale = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerScale;
        this.bytesPerColor = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerColor;
        this.bytesPerRotation = SplatBuffer.CompressionLevels[this.compressionLevel].BytesPerRotation;

        this.bytesPerSplat = this.bytesPerCenter + this.bytesPerScale + this.bytesPerColor + this.bytesPerRotation;

        fbf = this.fbf.bind(this);
        tbf = this.tbf.bind(this);

        this.linkBufferArrays();
    }

    linkBufferArrays() {
        let FloatArray = (this.compressionLevel === 0) ? Float32Array : Uint16Array;
        this.centerArray = new FloatArray(this.splatBufferData, 0, this.splatCount * SplatBuffer.CenterComponentCount);
        this.scaleArray = new FloatArray(this.splatBufferData, this.bytesPerCenter * this.splatCount,
                                         this.splatCount * SplatBuffer.ScaleComponentCount);
        this.colorArray = new Uint8Array(this.splatBufferData, (this.bytesPerCenter + this.bytesPerScale) * this.splatCount,
                                         this.splatCount * SplatBuffer.ColorComponentCount);
        this.rotationArray = new FloatArray(this.splatBufferData,
                                             (this.bytesPerCenter + this.bytesPerScale + this.bytesPerColor) * this.splatCount,
                                              this.splatCount * SplatBuffer.RotationComponentCount);
        this.bucketsBase = this.splatCount * this.bytesPerSplat;
    }

    fbf(f) {
        if (this.compressionLevel === 0) {
            return f;
        } else {
            return THREE.DataUtils.fromHalfFloat(f);
        }
    };

    tbf(f) {
        if (this.compressionLevel === 0) {
            return f;
        } else {
            return THREE.DataUtils.toHalfFloat(f);
        }
    };

    getHeaderBufferData() {
        return this.headerBufferData;
    }

    getSplatBufferData() {
        return this.splatBufferData;
    }

    getCenter(index, outCenter = new THREE.Vector3(), transform) {
        let bucket = [0, 0, 0];
        const centerBase = index * SplatBuffer.CenterComponentCount;
        if (this.compressionLevel > 0) {
            const sf = this.compressionScaleFactor;
            const sr = this.compressionScaleRange;
            const bucketIndex = Math.floor(index / this.bucketSize);
            bucket = new Float32Array(this.splatBufferData, this.bucketsBase + bucketIndex * this.bytesPerBucket, 3);
            outCenter.x = (this.centerArray[centerBase] - sr) * sf + bucket[0];
            outCenter.y = (this.centerArray[centerBase + 1] - sr) * sf + bucket[1];
            outCenter.z = (this.centerArray[centerBase + 2] - sr) * sf + bucket[2];
        } else {
            outCenter.x = this.centerArray[centerBase];
            outCenter.y = this.centerArray[centerBase + 1];
            outCenter.z = this.centerArray[centerBase + 2];
        }
        if (transform) outCenter.applyMatrix4(transform);
        return outCenter;
    }

    setCenter(index, center) {
        let bucket = [0, 0, 0];
        const centerBase = index * SplatBuffer.CenterComponentCount;
        if (this.compressionLevel > 0) {
            const sf = 1.0 / this.compressionScaleFactor;
            const sr = this.compressionScaleRange;
            const maxR = sr * 2 + 1;
            const bucketIndex = Math.floor(index / this.bucketSize);
            bucket = new Float32Array(this.splatBufferData, this.bucketsBase + bucketIndex * this.bytesPerBucket, 3);
            this.centerArray[centerBase] = clamp(Math.round((center.x - bucket[0]) * sf) + sr, 0, maxR);
            this.centerArray[centerBase + 1] = clamp(Math.round((center.y - bucket[1]) * sf) + sr, 0, maxR);
            this.centerArray[centerBase + 2] = clamp(Math.round((center.z - bucket[2]) * sf) + sr, 0, maxR);
        } else {
            this.centerArray[centerBase] = center.x;
            this.centerArray[centerBase + 1] = center.y;
            this.centerArray[centerBase + 2] = center.z;
        }
    }

    getScaleAndRotation = function() {

        const scaleMatrix = new THREE.Matrix4();
        const rotationMatrix = new THREE.Matrix4();
        const tempMatrix = new THREE.Matrix4();
        const tempPosition = new THREE.Vector3();

        return function(index, outScale = new THREE.Vector3(), outRotation = new THREE.Quaternion(), transform) {
            const scaleBase = index * SplatBuffer.ScaleComponentCount;
            outScale.set(fbf(this.scaleArray[scaleBase]), fbf(this.scaleArray[scaleBase + 1]), fbf(this.scaleArray[scaleBase + 2]));
            const rotationBase = index * SplatBuffer.RotationComponentCount;
            outRotation.set(fbf(this.rotationArray[rotationBase + 1]), fbf(this.rotationArray[rotationBase + 2]),
                            fbf(this.rotationArray[rotationBase + 3]), fbf(this.rotationArray[rotationBase]));
            if (transform) {
                scaleMatrix.makeScale(outScale.x, outScale.y, outScale.z);
                rotationMatrix.makeRotationFromQuaternion(outRotation);
                tempMatrix.copy(scaleMatrix).multiply(rotationMatrix).multiply(transform);
                tempMatrix.decompose(tempPosition, outRotation, outScale);
            }
        };

    }();

    getColor(index, outColor = new THREE.Vector4(), transform) {
        const colorBase = index * SplatBuffer.ColorComponentCount;
        outColor.set(this.colorArray[colorBase], this.colorArray[colorBase + 1],
                     this.colorArray[colorBase + 2], this.colorArray[colorBase + 3]);
        // TODO: apply transform for spherical harmonics
        return outColor;
    }

    setColor(index, color) {
        const colorBase = index * SplatBuffer.ColorComponentCount;
        this.colorArray[colorBase] = color.x;
        this.colorArray[colorBase + 1] = color.y;
        this.colorArray[colorBase + 2] = color.z;
        this.colorArray[colorBase + 3] = color.w;
    }

    getSplatCount() {
        return this.splatCount;
    }

    fillCovarianceArray(covarianceArray, destOffset, transform) {
        const splatCount = this.splatCount;

        const scale = new THREE.Vector3();
        const rotation = new THREE.Quaternion();
        const rotationMatrix = new THREE.Matrix3();
        const scaleMatrix = new THREE.Matrix3();
        const covarianceMatrix = new THREE.Matrix3();
        const transformedCovariance = new THREE.Matrix3();
        const transform3x3 = new THREE.Matrix3();
        const transform3x3Transpose = new THREE.Matrix3();
        const tempMatrix4 = new THREE.Matrix4();

        for (let i = 0; i < splatCount; i++) {
            const scaleBase = i * SplatBuffer.ScaleComponentCount;
            scale.set(fbf(this.scaleArray[scaleBase]), fbf(this.scaleArray[scaleBase + 1]), fbf(this.scaleArray[scaleBase + 2]));
            tempMatrix4.makeScale(scale.x, scale.y, scale.z);
            scaleMatrix.setFromMatrix4(tempMatrix4);

            const rotationBase = i * SplatBuffer.RotationComponentCount;
            rotation.set(fbf(this.rotationArray[rotationBase + 1]),
                         fbf(this.rotationArray[rotationBase + 2]),
                         fbf(this.rotationArray[rotationBase + 3]),
                         fbf(this.rotationArray[rotationBase]));
            tempMatrix4.makeRotationFromQuaternion(rotation);
            rotationMatrix.setFromMatrix4(tempMatrix4);

            covarianceMatrix.copy(rotationMatrix).multiply(scaleMatrix);
            transformedCovariance.copy(covarianceMatrix).transpose().premultiply(covarianceMatrix);
            const covBase = SplatBuffer.CovarianceSizeFloats * (i + destOffset);

            if (transform) {
                transform3x3.setFromMatrix4(transform);
                transform3x3Transpose.copy(transform3x3).transpose();
                transformedCovariance.multiply(transform3x3Transpose);
                transformedCovariance.premultiply(transform3x3);
            }

            covarianceArray[covBase] = transformedCovariance.elements[0];
            covarianceArray[covBase + 1] = transformedCovariance.elements[3];
            covarianceArray[covBase + 2] = transformedCovariance.elements[6];
            covarianceArray[covBase + 3] = transformedCovariance.elements[4];
            covarianceArray[covBase + 4] = transformedCovariance.elements[7];
            covarianceArray[covBase + 5] = transformedCovariance.elements[8];
        }
    }

    fillCenterArray(outCenterArray, destOffset, transform) {
        const splatCount = this.splatCount;
        let bucket = [0, 0, 0];
        const center = new THREE.Vector3();
        for (let i = 0; i < splatCount; i++) {
            const centerSrcBase = i * SplatBuffer.CenterComponentCount;
            const centerDestBase = (i + destOffset) * SplatBuffer.CenterComponentCount;
            if (this.compressionLevel > 0) {
                const bucketIndex = Math.floor(i / this.bucketSize);
                bucket = new Float32Array(this.splatBufferData, this.bucketsBase + bucketIndex * this.bytesPerBucket, 3);
                const sf = this.compressionScaleFactor;
                const sr = this.compressionScaleRange;
                center.x = (this.centerArray[centerSrcBase] - sr) * sf + bucket[0];
                center.y = (this.centerArray[centerSrcBase + 1] - sr) * sf + bucket[1];
                center.z = (this.centerArray[centerSrcBase + 2] - sr) * sf + bucket[2];
            } else {
                center.x = this.centerArray[centerSrcBase];
                center.y = this.centerArray[centerSrcBase + 1];
                center.z = this.centerArray[centerSrcBase + 2];
            }
            if (transform) {
                center.applyMatrix4(transform);
            }
            outCenterArray[centerDestBase] = center.x;
            outCenterArray[centerDestBase + 1] = center.y;
            outCenterArray[centerDestBase + 2] = center.z;
        }
    }

    fillColorArray(outColorArray, destOffset, transform) {
        const splatCount = this.splatCount;
        for (let i = 0; i < splatCount; i++) {
            const colorSrcBase = i * SplatBuffer.ColorComponentCount;
            const colorDestBase = (i + destOffset) * SplatBuffer.ColorComponentCount;
            outColorArray[colorDestBase] = this.colorArray[colorSrcBase];
            outColorArray[colorDestBase + 1] = this.colorArray[colorSrcBase + 1];
            outColorArray[colorDestBase + 2] = this.colorArray[colorSrcBase + 2];
            outColorArray[colorDestBase + 3] = this.colorArray[colorSrcBase + 3];
            // TODO: implement application of transform for spherical harmonics
        }
    }

    swapVertices(indexA, indexB) {

        const getScale = (index, outScale = new THREE.Vector3()) => {
            const scaleBase = index * SplatBuffer.ScaleComponentCount;
            outScale.set(fbf(this.scaleArray[scaleBase]), fbf(this.scaleArray[scaleBase + 1]), fbf(this.scaleArray[scaleBase + 2]));
            return outScale;
        };

        const setScale = (index, scale) => {
            const scaleBase = index * SplatBuffer.ScaleComponentCount;
            this.scaleArray[scaleBase] = tbf(scale.x);
            this.scaleArray[scaleBase + 1] = tbf(scale.y);
            this.scaleArray[scaleBase + 2] = tbf(scale.z);
        };

        const getRotation = (index, outRotation = new THREE.Quaternion()) => {
            const rotationBase = index * SplatBuffer.RotationComponentCount;
            outRotation.set(fbf(this.rotationArray[rotationBase + 1]), fbf(this.rotationArray[rotationBase + 2]),
                            fbf(this.rotationArray[rotationBase + 3]), fbf(this.rotationArray[rotationBase]));
            return outRotation;
        };

        const setRotation = (index, rotation) => {
            const rotationBase = index * SplatBuffer.RotationComponentCount;
            this.rotationArray[rotationBase] = tbf(rotation.w);
            this.rotationArray[rotationBase + 1] = tbf(rotation.x);
            this.rotationArray[rotationBase + 2] = tbf(rotation.y);
            this.rotationArray[rotationBase + 3] = tbf(rotation.z);
        };

        getCenter(indexA, tempVector3A);
        getCenter(indexB, tempVector3B);
        setCenter(indexB, tempVector3A);
        setCenter(indexA, tempVector3B);

        getScale(indexA, tempVector3A);
        getScale(indexB, tempVector3B);
        setScale(indexB, tempVector3A);
        setScale(indexA, tempVector3B);

        getRotation(indexA, tempQuaternion4A);
        getRotation(indexB, tempQuaternion4B);
        setRotation(indexB, tempQuaternion4A);
        setRotation(indexA, tempQuaternion4B);

        getColor(indexA, tempVector4A);
        getColor(indexB, tempVector4B);
        setColor(indexB, tempVector4A);
        setColor(indexA, tempVector4B);

    }

}
