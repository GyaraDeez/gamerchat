---
description: All error responses should be in JSON format with a message property.
---

When sending an error response, use res.status(statusCode).json({ message: "Error message" })