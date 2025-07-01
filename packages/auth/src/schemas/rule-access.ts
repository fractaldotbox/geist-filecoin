export const ACCESS_SCHEMA  = {
    "title": "Claims Rule",
    "type": "object",
    "properties": {
      "required": ["tokenType", "claims"],
      "anyOf": [
        {
          "tokenType": "ucan",
          "claims": ["space/info", "upload/list", "upload/create", "upload/update", "upload/read"]
        },
        {
          "tokenType": "jwt",
          "claims": ["admin:iam"]
        }
      ]
    }
}