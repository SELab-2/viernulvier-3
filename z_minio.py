import json
import boto3
from botocore.client import Config

s3 = boto3.client(
    "s3",
    endpoint_url="http://localhost:9000",
    aws_access_key_id="minioadmin",
    aws_secret_access_key="minioadmin",
    config=Config(signature_version="s3v4"),
    region_name="us-east-1",
)

# create bucket if it doesn't exist
try:
    s3.create_bucket(Bucket="media")
except s3.exceptions.BucketAlreadyOwnedByYou:
    pass

# make bucket public
policy = json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"AWS": ["*"]},
        "Action": ["s3:GetObject"],
        "Resource": ["arn:aws:s3:::media/*"]
    }]
})
s3.put_bucket_policy(Bucket="media", Policy=policy)

# upload
s3.put_object(Bucket="media", Key="test_1.png", Body=open("z_image.png", "rb"), ContentType="image/png")

# plain permanent URL, no signing
print("http://localhost:9000/media/test.png")