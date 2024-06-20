export const TryCatch = (passedFunc) => async(req,res,next)=>{
    try{
        await passedFunc(req,res,next);
    }catch(error){
console.log("hi") 
        next(error);
    }
}

// main thing is that when you send error to the next like next(err) so then express search for the errroMiddleware which would contain a err object and then use such middleware then just send response to the client side so it will go as error to the client side 
export const errorMiddleware = (err , req,res ,next)=>{
    // console.log(err.statusCode)
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        message:err.message || "Internal Server Error"
    })
}