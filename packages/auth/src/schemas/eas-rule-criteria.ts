export const EAS_RULE_SCHEMA  ={
    "title": "EAS Rule",
    "type": "object",
    "key": "eas-rule-criteria",
    "properties": {
      "schemaId": {
        "type": "string",
        "description": "Schema ID",
        "examples": ["12"]
      },
    //  use the indexed field
      "field": {
        "type": "string",
        "description": "field of attestation contains the DID",
        "examples": ["recipient"]
      }
    },
    "required": ["didPattern", "claims"]
  }