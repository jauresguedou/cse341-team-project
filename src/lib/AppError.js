export class AppError extends Error {
    /**
     * A custom error for forming the errors 
     */
    message;
    statusCode;
    constructor(_message, _statusCode) {
        super(_message)
        this.message = _message
        this.statusCode = _statusCode
    }
}