# Python Library Registry

Libraries that should use Context7 for live documentation instead of training data.

## Web Frameworks

#### FastAPI
- **Aliases**: `fastapi`, `fast-api`
- **Context7**: `use context7 for fastapi`
- **Topics**: routing, dependency injection, middleware, async, OpenAPI, Pydantic integration

#### Django
- **Aliases**: `django`
- **Context7**: `use context7 for django`
- **Topics**: ORM, views, middleware, admin, migrations, REST framework

#### Flask
- **Aliases**: `flask`
- **Context7**: `use context7 for flask`
- **Topics**: routing, blueprints, extensions, Jinja2, SQLAlchemy integration

## Database & ORM

#### SQLAlchemy
- **Aliases**: `sqlalchemy`, `sqla`
- **Context7**: `use context7 for sqlalchemy`
- **Topics**: ORM, async sessions, relationships, migrations, Core expressions

#### Alembic
- **Aliases**: `alembic`
- **Context7**: `use context7 for alembic`
- **Topics**: migrations, autogenerate, versioning, multi-database

#### SQLModel
- **Aliases**: `sqlmodel`
- **Context7**: `use context7 for sqlmodel`
- **Topics**: models, relationships, FastAPI integration, sessions

## Data Validation

#### Pydantic
- **Aliases**: `pydantic`, `pydantic-v2`
- **Context7**: `use context7 for pydantic`
- **Topics**: BaseModel, validators, field types, serialization, settings

## Data Processing & ETL

#### Pandas
- **Aliases**: `pandas`, `pd`
- **Context7**: `use context7 for pandas`
- **Topics**: DataFrame, Series, groupby, merge, IO, indexing

#### Polars
- **Aliases**: `polars`
- **Context7**: `use context7 for polars`
- **Topics**: DataFrame, LazyFrame, expressions, IO, performance

#### Apache Airflow
- **Aliases**: `airflow`, `apache-airflow`
- **Context7**: `use context7 for airflow`
- **Topics**: DAGs, operators, sensors, connections, XCom, TaskFlow API

#### dbt
- **Aliases**: `dbt`, `dbt-core`
- **Context7**: `use context7 for dbt`
- **Topics**: models, tests, sources, macros, materializations

## Testing

#### Pytest
- **Aliases**: `pytest`
- **Context7**: `use context7 for pytest`
- **Topics**: fixtures, parametrize, markers, plugins, conftest, mocking

## HTTP & Async

#### httpx
- **Aliases**: `httpx`
- **Context7**: `use context7 for httpx`
- **Topics**: async client, streaming, authentication, transports

#### aiohttp
- **Aliases**: `aiohttp`
- **Context7**: `use context7 for aiohttp`
- **Topics**: client sessions, server, WebSocket, middleware

#### Celery
- **Aliases**: `celery`
- **Context7**: `use context7 for celery`
- **Topics**: tasks, workers, beat, results, chains, groups

## CLI & Config

#### Click
- **Aliases**: `click`
- **Context7**: `use context7 for click`
- **Topics**: commands, groups, options, arguments, decorators

#### Typer
- **Aliases**: `typer`
- **Context7**: `use context7 for typer`
- **Topics**: commands, CLI apps, type hints, auto-completion

## Cloud & Infrastructure

#### Boto3
- **Aliases**: `boto3`, `aws-sdk-python`
- **Context7**: `use context7 for boto3`
- **Topics**: S3, EC2, Lambda, DynamoDB, IAM, sessions, resources

## Adding New Libraries

```markdown
#### Library Name
- **Aliases**: `alias1`, `alias2`
- **Context7**: `use context7 for library-name`
- **Topics**: topic1, topic2, topic3
```
