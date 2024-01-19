import { Bucket, Table, StackContext } from "sst/constructs";

export default function Backend({ stack }: StackContext) {
  const storage = new Bucket(stack, "storage", {
    cors: [
      {
        allowedMethods: ["HEAD", "GET", "PUT", "POST", "DELETE"],
        allowedOrigins: ["*"],
        allowedHeaders: ["*"],
        exposedHeaders: ["ETag"],
      },
    ],
  });

  const db = new Table(stack, "db", {
    fields: {
      pk: "string",
      sk: "string",
      gsi1pk: "string",
      gsi1sk: "string",
    },
    primaryIndex: {
      partitionKey: "pk",
      sortKey: "sk",
    },
    globalIndexes: {
      gsi1: {
        partitionKey: "gsi1pk",
        sortKey: "gsi1sk",
      },
    },
  });

  stack.addOutputs({
    bucketName: storage.bucketName,
    tableName: db.tableName,
  });

  return { storage, db };
}
