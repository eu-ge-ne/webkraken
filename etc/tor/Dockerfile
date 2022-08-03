FROM alpine:3

LABEL version = "2022-08-02"

RUN apk update && apk add tor

COPY ./torrc /etc/tor/torrc
RUN chown -R tor /etc/tor
USER tor

ENTRYPOINT ["tor"]
