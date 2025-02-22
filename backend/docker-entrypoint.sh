#!/bin/bash

source /backend/.venv/bin/activate
exec "$@"
uv run manage.py runserver 0.0.0.0:8000 &

wait -n

exit $?
