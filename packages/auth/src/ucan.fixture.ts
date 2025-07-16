export const UCAN_FIXTURE_JSON = [
    {
        "iss": "did:mailto:debuggingfuture.com:hi",
        "aud": "did:key:z4MXj1wBzi9jUstyNmjKfeZcLTaPupodBbLTttuqoWESMQTMXa8TyLJXNjao7vDrM4bopmhxNyy4ChP7EHxD6xa9GqD4W1bHoHH7gaF4m71bq3ef62hF3YAsGthFeGeKDrXSY7CbpMfuSEJwaGeZ5tGp3XHnTpjsKwcpMU97Sivr3FHTL26byszNAkg95g8cjYtvgpJdBRjJpxJXLn2GurFhbjzgSoH3pxFDebRyqvZ5TNsrVYHxPs4H1kQpsifsDspH8bqKa2mUMpa1jsnxmwQ8fufm5scFTjAA8xHWzhmR9k7dym8bSgqdotWi7aomQdPv83cAf87GvxuPnQSrdWyLoCBFuYH28t1B2dqbuuShfRTYJXQvc",
        "v": "0.9.1",
        "s": {
            "/": {
                "bytes": "gKADAA"
            }
        },
        "exp": null,
        "att": [
            {
                "can": "*",
                "with": "ucan:*"
            }
        ],
        "fct": [
            {
                "access/confirm": {
                    "/": "bafyreihpyiwm6iq4jsakg5aoikszdnua4dbhuyjbvylyzjyn5z3iepjima"
                },
                "access/request": {
                    "/": "bafyreidcz2wvuhc3pc65rrcqv3p2nirr6uwddpashvcbmd7z2mjvzyk77y"
                }
            }
        ],
        "prf": [],
        "/": "bafyreie2qgw5znmgzgflv42jmyiafxzvmq4z66ez4xvinhdy2in3s6jkae"
    },
    {
        "iss": "did:web:up.storacha.network",
        "aud": "did:key:z4MXj1wBzi9jUstyNmjKfeZcLTaPupodBbLTttuqoWESMQTMXa8TyLJXNjao7vDrM4bopmhxNyy4ChP7EHxD6xa9GqD4W1bHoHH7gaF4m71bq3ef62hF3YAsGthFeGeKDrXSY7CbpMfuSEJwaGeZ5tGp3XHnTpjsKwcpMU97Sivr3FHTL26byszNAkg95g8cjYtvgpJdBRjJpxJXLn2GurFhbjzgSoH3pxFDebRyqvZ5TNsrVYHxPs4H1kQpsifsDspH8bqKa2mUMpa1jsnxmwQ8fufm5scFTjAA8xHWzhmR9k7dym8bSgqdotWi7aomQdPv83cAf87GvxuPnQSrdWyLoCBFuYH28t1B2dqbuuShfRTYJXQvc",
        "v": "0.9.1",
        "s": {
            "/": {
                "bytes": "7aEDQM2UbXDcAct7GA1AuBT+9T6yXOYXeQ8Sa1cSI0Nl+hpUh19aZ/yvcR/CPz22uVYxMle7mjxa/r3osOTD0qUkVAo"
            }
        },
        "exp": null,
        "att": [
            {
                "can": "ucan/attest",
                "nb": {
                    "proof": {
                        "/": "bafyreie2qgw5znmgzgflv42jmyiafxzvmq4z66ez4xvinhdy2in3s6jkae"
                    }
                },
                "with": "did:web:up.storacha.network"
            }
        ],
        "fct": [
            {
                "access/confirm": {
                    "/": "bafyreihpyiwm6iq4jsakg5aoikszdnua4dbhuyjbvylyzjyn5z3iepjima"
                },
                "access/request": {
                    "/": "bafyreidcz2wvuhc3pc65rrcqv3p2nirr6uwddpashvcbmd7z2mjvzyk77y"
                }
            }
        ],
        "prf": [],
        "/": "bafyreic3bhihi4ptnzeefrds6lyurug63zm33eqolzx4kydj7odlewcrz4"
    }
]

// export const UCAN_FIXTURE_JSON = UCAN_FIXTURE.map(proof=>proof.toJSON())

export const UCAN_PROOFS_FIXTURE_BASE64 = "OqJlcm9vdHOB2CpYJQABcRIg4Gw6pcWMzXMQD1dutbp7XmQOuxfC9/qHrx8kfGEhetRndmVyc2lvbgGIBAFxEiCaga3ctYbJirrzSWYQAt81ZDmfeJnl6oaceNIbuXkqAahhc0SAoAMAYXZlMC45LjFjYXR0gaJjY2FuYSpkd2l0aGZ1Y2FuOipjYXVkWQEQhSQwggEKAoIBAQCYdsccn664R1Tm3Q2Yf51vrkTmJcOZqISxeMy4XH+tt7SuFKYtxSh/JMTq/l3Br458gfqkWy6DXLXyXENPQ8qWn92jS7ZbYx3PRPAkY6S81fjxipV3YDlf9LsfY0nEi0itQ79COhyF/2NGQ13Qf+irPE7wQNpLESxP8HahdDZT+x/XabwP/r4Zj6ZYAXJoLQUSQSY6oRaJKrMnIECo+QJfXv3SlDzPE64yrDhfBPg4vf1aIL1e600n2wJsv9nfypEQdPf2xs/l2V4qhx8oq3sMi9oP9qh4FSwGd6rTKQi7D8HW6vzt9uSYnK9bPbyg0PRcHi4VXmbZKBN4DxbmCKPRAgMBAAFjZXhw9mNmY3SBom5hY2Nlc3MvY29uZmlybdgqWCUAAXESIO/CLM8iHEyAo3QOQqWRtoDgwnphIa4XjKcN7naCPShgbmFjY2Vzcy9yZXF1ZXN02CpYJQABcRIgYs6tWhxbeL3YxFCu36aiMfUsMbwSPUQWD/nTE1zhX/5jaXNzWB+dGm1haWx0bzpkZWJ1Z2dpbmdmdXR1cmUuY29tOmhpY3ByZoBZAXESIOBsOqXFjM1zEA9XbrW6e15kDrsXwvf6h68fJHxhIXrUoWp1Y2FuQDAuOS4x2CpYJQABcRIgmoGt3LWGyYq680lmEALfNWQ5n3iZ5eqGnHjSG7l5KgE=,OqJlcm9vdHOB2CpYJQABcRIgvBJixppKCK2RV5n6zgiQrGmvfkwESGPuJ+ILsXNg70tndmVyc2lvbgGWBQFxEiBbCdB0cfNuSELEcvLxSNDe3lm9kg5eb8VgafuGslhRz6hhc1hE7aEDQM2UbXDcAct7GA1AuBT+9T6yXOYXeQ8Sa1cSI0Nl+hpUh19aZ/yvcR/CPz22uVYxMle7mjxa/r3osOTD0qUkVAphdmUwLjkuMWNhdHSBo2JuYqFlcHJvb2bYKlglAAFxEiCaga3ctYbJirrzSWYQAt81ZDmfeJnl6oaceNIbuXkqAWNjYW5rdWNhbi9hdHRlc3Rkd2l0aHgbZGlkOndlYjp1cC5zdG9yYWNoYS5uZXR3b3JrY2F1ZFkBEIUkMIIBCgKCAQEAmHbHHJ+uuEdU5t0NmH+db65E5iXDmaiEsXjMuFx/rbe0rhSmLcUofyTE6v5dwa+OfIH6pFsug1y18lxDT0PKlp/do0u2W2Mdz0TwJGOkvNX48YqVd2A5X/S7H2NJxItIrUO/Qjochf9jRkNd0H/oqzxO8EDaSxEsT/B2oXQ2U/sf12m8D/6+GY+mWAFyaC0FEkEmOqEWiSqzJyBAqPkCX1790pQ8zxOuMqw4XwT4OL39WiC9XutNJ9sCbL/Z38qREHT39sbP5dleKocfKKt7DIvaD/aoeBUsBneq0ykIuw/B1ur87fbkmJyvWz28oND0XB4uFV5m2SgTeA8W5gij0QIDAQABY2V4cPZjZmN0gaJuYWNjZXNzL2NvbmZpcm3YKlglAAFxEiDvwizPIhxMgKN0DkKlkbaA4MJ6YSGuF4ynDe52gj0oYG5hY2Nlc3MvcmVxdWVzdNgqWCUAAXESIGLOrVocW3i92MRQrt+mojH1LDG8Ej1EFg/50xNc4V/+Y2lzc1gZnRp3ZWI6dXAuc3RvcmFjaGEubmV0d29ya2NwcmaAWQFxEiC8EmLGmkoIrZFXmfrOCJCsaa9+TARIY+4n4guxc2DvS6FqdWNhbkAwLjkuMdgqWCUAAXESIFsJ0HRx825IQsRy8vFI0N7eWb2SDl5vxWBp+4ayWFHP"