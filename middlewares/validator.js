import Joi from "joi";
export const signupSchema = Joi.object({
  email: Joi.string()
    .email({
      tlds: { allow: ["com", "net", "org", "edu"] },
    })
    .min(5)
    .required(),
  password: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,25}$"
      ),
      "Password must be 6-25 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
    )
    .required(),
});

export const acceptCodeSchema = Joi.object({
  email: Joi.string()
    .email({
      tlds: { allow: ["com", "net", "org", "edu"] },
    })
    .min(5)
    .required(),
  providedCode: Joi.number().required(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,25}$"
      ),
      "Password must be 6-25 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
    )
    .required(),
  newPassword: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,25}$"
      ),
      "Password must be 6-25 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
    )
    .required(),
});

export const forgetPasswordSchema = Joi.object({
  email: Joi.string()
    .email({
      tlds: { allow: ["com", "net", "org", "edu"] },
    })
    .min(5)
    .required(),
  providedCode: Joi.number().required(),
  newPassword: Joi.string()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{6,25}$"
      ),
      "Password must be 6-25 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
    )
    .required(),
});

export const createPoatSchema = Joi.object({
  title: Joi.string().min(3).max(70).required(),
  description: Joi.string().min(3).max(600).required(),
  author: Joi.string().required(),
});
export const siginSchema = signupSchema;
