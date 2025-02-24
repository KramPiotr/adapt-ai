#!/bin/bash

source /backend/.venv/bin/activate
exec "$@"
uv run manage.py migrate
uv run manage.py runserver 0.0.0.0:8000 &

uv run celery -A settings worker --loglevel=info &

wait -n

exit $?
