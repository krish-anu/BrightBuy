const errorMiddleware = (err, req, res, next) => {
    try {
        console.error(err);
        res.status(err.statusCode || 500).json({
            error: err.message || `Server Error`
        });
    } catch (error) {
        next(error);
    }
};

module.exports = errorMiddleware;