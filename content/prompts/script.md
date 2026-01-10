Script Prompt
=============

This prompt provides the requirements and guidelines for the monitoring script.

It runs in the following environment:

```bash
conda create -n DashPy python=3.12.12 -y
conda activate DashPy
conda install -c conda-forge \
  psutil \
  docker-py \
  requests \
  dnspython \
  python-dotenv \
  pydantic \
  python-systemd \
  -y
pip install PlexAPI
```
We then have:

| Package name   | Version |
| -------------- | ------- |
| dnspython      | 2.8.0   |
| docker-py      | 7.1.0   |
| PlexAPI        | 4.17.2  |
| psutil         | 7.2.1   |
| pydantic       | 2.12.5  |
| pydantic-core  | 2.41.5  |
| python-dotenv  | 1.2.1   |
| python-systemd | 235     |
| requests       | 2.32.5  |

The package `boto3` version 1.40.54 is also installed, but that's not to be used by the agent.