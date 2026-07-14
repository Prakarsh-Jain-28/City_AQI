function errorHandler(err, req, res, next) {
    console.error("Error:", err.message);
    console.error(err.stack);

    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    return res.status(statusCode).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
}

module.exports = errorHandler;
