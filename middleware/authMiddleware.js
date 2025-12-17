import JWT from "jsonwebtoken"
import Admin from "../model/adminModel.js"

//USER AUTHERIZATION
export const isAuth = async(req,res,next)=>{
const {token}= req.cookies;
//validation
if(!token){
    return res.status(401).send({
        success:false,
        message:"Unauthorized User"
    })
}
const decodeData = JWT.verify(token,process.env.JWT_SECRET)
req.user = await Admin.findById(decodeData._id);
req.emailId = decodeData.emailId;
next();
}