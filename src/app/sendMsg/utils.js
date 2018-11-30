import UserModel from '../wechatApi/model';

export const getUsers = async authCode => {
  const res = await UserModel.find({ authCode, disabled: { $ne: true } });
  const openIdArr = res.map(item => item.openId);
  return openIdArr;
};
