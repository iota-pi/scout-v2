ARG base_image
FROM ${base_image}

ENV POETRY_VERSION=1.1.3
ENV POETRY_PATH=/opt/poetry
ENV PATH="$POETRY_PATH/bin:$PATH"

USER root
RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
        curl \
        git \
    && rm -rf /var/lib/apt/lists/*

# Install poetry
RUN curl -sSL https://raw.githubusercontent.com/sdispater/poetry/master/get-poetry.py | python \
    && mv /root/.poetry $POETRY_PATH \
    && chmod +x $POETRY_PATH/bin/poetry \
    && poetry config virtualenvs.create false

RUN python -m venv $VENV_PATH

ARG username=appuser
USER ${username}
