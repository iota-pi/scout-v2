from typing import Any
import boto3


class Writer:
    def write(self, path: str, content: str) -> None:
        raise NotImplementedError()


class S3Writer(Writer):
    bucket: str
    s3: Any

    def __init__(self) -> None:
        super().__init__()
        self.s3 = boto3.client("s3")

    def write(self, path: str, content: str) -> None:
        response = self.s3.put_object(
            Bucket=self.bucket,
            Key=path,
            Body=content,
            ACL="public-read",
        )
        print(response)
        return response


class FileWriter(Writer):
    def write(self, path: str, content: str) -> None:
        with open(path, "w") as f:
            f.write(content)


def get_writer(bucket: str = None) -> Writer:
    print(bucket)
    if bucket:
        writer = S3Writer()
        writer.bucket = bucket
        return writer
    else:
        return FileWriter()
