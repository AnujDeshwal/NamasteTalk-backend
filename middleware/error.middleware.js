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
    err.message ||= "Internal Server Error";
    err.statusCode ||= 500;
    if (err.code === 11000) {
        const error = Object.keys(err.keyPattern).join(",");
        // below thing will tell us which fields are duplicate 
        err.message = `${error} already exists`;
        err.statusCode = 400;
      }
    
      if (err.name === "CastError") {
        const errorPath = err.path;
        err.message = `Invalid Format of ${errorPath}`;
        err.statusCode = 400;
      }
    const response = {
        success: false,
        message: err.message,
      };
    
      return res.status(err.statusCode).json(response);
}