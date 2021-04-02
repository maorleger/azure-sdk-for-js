ARG NODE_VERSION

FROM node:$NODE_VERSION-alpine

# Must be after FROM
ARG ARTIFACT_PATH
ARG ENV_FILE_PATH

RUN apk add openssh

WORKDIR workspace

RUN mkdir package

COPY ./samples/javascript/package.json ./samples/javascript/package.json
COPY ./samples/typescript/package.json ./samples/typescript/package.json

COPY $ARTIFACT_PATH package/$ARTIFACT_PATH

RUN npm --prefix samples/javascript install package/$ARTIFACT_PATH
RUN npm --prefix samples/typescript install package/$ARTIFACT_PATH

RUN npm --prefix samples/typescript install
RUN npm --prefix samples/javascript install


COPY ./run_samples.sh ./samples
COPY $ENV_FILE_PATH ./samples

COPY ./samples/ samples/

RUN npm --prefix samples/typescript run build

WORKDIR samples/

CMD ["./run_samples.sh"]
