import { sendTempMsg } from '../wechatApi/utils';
import { getUsers } from './utils';

export const sendMsg = async (request, reply) => {
  const { authCode, result, subscribeTempId } = request.payload;
  const openIdArr = await getUsers(authCode);
  const res = await sendTempMsg(openIdArr, subscribeTempId, result);
  return reply(res);
};
