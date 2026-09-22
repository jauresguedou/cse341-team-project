export class AppError extends Error {
    /**
     * A custom error for forming the errors 
     */
    message;
    statusCode;
    constructor(_message, _statusCode) {
        super(this.message);
        this.message = _message
        statusCode = _statusCode
    }
}