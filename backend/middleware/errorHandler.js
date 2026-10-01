function errorHandler(err, req, res, next) {
    // Check if app is running in development
    const isDev = process.env.NODE_ENV === "development";

    // Default server error
    let status = 500;
    let message = "Something went wrong on the server.";

    // Mongoose validation error
    if (err.name === "ValidationError" && err.errors) {
        status = 400;

        // Get all validation messages
        message = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
    }

    // Duplicate unique field, like email
    else if (err.code === 11000) {
        status = 409;

        const field = Object.keys(err.keyValue || {})[0] || "value";
        message = `That ${field} is already in use.`;
    }

    // Invalid MongoDB ObjectId
    else if (err.name === "CastError") {
        status = 400;
        message = `Invalid ${err.path || "id"} format.`;
    }

    // JWT token has expired
    else if (err.name === "TokenExpiredError") {
        status = 401;
        message = "Your session has expired. Please log in again.";
    }

    // JWT token is invalid
    else if (err.name === "JsonWebTokenError") {
        status = 401;
        message = "Invalid token. Please log in again.";
    }

    // Invalid JSON in request body
    else if (err.type === "entity.parse.failed") {
        status = 400;
        message = "Request body is not valid JSON.";
    }

    // Request body is too large
    else if (err.type === "entity.too.large") {
        status = 413;
        message = "Request body is too large.";
    }

    // Log unexpected server errors
    if (status === 500) {
        console.error("Unhandled error:", err.message);

        // Show full error details only in development
        if (isDev) console.error(err.stack);
    }

    // Send error response
    const body = { error: message };

    // Include stack trace only during development
    if (isDev && status === 500) {
        body.stack = err.stack;
    }

    res.status(status).json(body);
}

module.exports = errorHandler;