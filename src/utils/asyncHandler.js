const asyncHandler = (requestHandle) => {
  return (req, res, next) => {
    Promise.resolve(requestHandle(req, res, next)).catch((err) => next(err));
  };
};

export default asyncHandler ;

// const asyncHandler=(requestHandle)=>async(req,res,next)=>{
//     try {
//         await requestHandle(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500)
//         .json({
//             sucess: false,
//             message:err.message
//         })
//     }
// }
