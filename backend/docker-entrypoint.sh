#!/bin/bash

source /backend/.venv/bin/activate
uv run manage.py runserver 0.0.0.0:8000
