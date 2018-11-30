import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  openId: {
    type: String,
    required: true,
    index: true,
  },
  nickName: {
    type: String,
  },
  authCode: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const UserModel = mongoose.model('wechat_user', UserSchema);

export default UserModel;
