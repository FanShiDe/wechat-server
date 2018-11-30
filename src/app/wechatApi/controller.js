import axios from 'axios';
import Config from 'config';
import crypto from 'crypto';
import UserModel from './model';
import { toXML, getUserInfo } from './utils';

export const wechatAuth = (request, reply) => {
  /**
   * signature 微信加密签名
   * timestamp 时间戳
   * nonce 随机数
   * echostr 随机字符串
   */
  const { signature, timestamp, nonce, echostr } = request.query;
  // 2.将token、timestamp、nonce三个参数进行字典序排序
  const array = [Config.get('wechatServer.token'), timestamp, nonce];
  array.sort();

  // 3.将三个参数字符串拼接成一个字符串进行sha1加密
  const tempStr = array.join('');
  const hashCode = crypto.createHash('sha1'); // 创建加密类型
  const resultCode = hashCode.update(tempStr, 'utf8').digest('hex'); // 对传入的字符串进行加密

  // 4.开发者获得加密后的字符串可与signature对比，标识该请求来源于微信
  console.log(resultCode === signature, '+++++++++++++++');
  if (resultCode === signature) {
    return reply(echostr);
  }
  return reply(false);
};

export const userBind = async (request, reply) => {
  // FromUserName 每个微信用户相对每个公众号，具有唯一OpenID
  // ToUserName 开发者微信号
  // Event 事件类型, subscribe、unsubscribe、scan
  const {
    xml: { FromUserName, ToUserName, Event, EventKey },
  } = request.pre.toXML;
  console.log('*******************');
  console.log(request.pre.toXML);
  console.log(Event);
  console.log('*******************');
  const regex = new RegExp('^(qrscene_)([0-9a-zA-Z]+)$');
  if (Event.toLowerCase() === 'subscribe') {
    const authCode = EventKey.match(regex)[2];
    console.log('authCode', authCode);
    await UserModel.findOneAndUpdate(
      { openId: FromUserName, authCode },
      {
        $set: {
          openId: FromUserName,
          authCode,
        },
      },
      { upsert: true, new: true }
    );
    const xmlRes = toXML({
      ToUserName: FromUserName,
      FromUserName: ToUserName,
      Content: '服务绑定成功',
    });
    reply(xmlRes).header('Content-Type', 'application/xml');
    const userMsg = await getUserInfo(FromUserName);
    const { nickname } = userMsg;
    await UserModel.findOneAndUpdate(
      { openId: FromUserName, authCode },
      {
        $set: {
          nickName: nickname,
        },
      }
    );
    return true;
  }
  if (Event.toLowerCase() === 'scan') {
    const docs = await UserModel.find({
      openId: FromUserName,
      authCode: EventKey,
    });
    if (docs.length === 0) {
      await UserModel.create({ openId: FromUserName, authCode: EventKey });
      const xmlRes = toXML({
        ToUserName: FromUserName,
        FromUserName: ToUserName,
        Content: '服务绑定成功',
      });
      reply(xmlRes).header('Content-Type', 'application/xml');
      const userMsg = await getUserInfo(FromUserName);
      const { nickname } = userMsg;
      await UserModel.findOneAndUpdate(
        { openId: FromUserName, authCode: EventKey },
        {
          $set: {
            nickName: nickname,
          },
        }
      );
      return true;
    }
    const xmlRes = toXML({
      ToUserName: FromUserName,
      FromUserName: ToUserName,
      Content: '已关注该服务',
    });
    return reply(xmlRes).header('Content-Type', 'application/xml');
  }
  return reply(null);
};

export const generateQRCode = async (request, reply) => {
  const { authCode } = request.params;
  const result = await axios.post(
    `${Config.get('wechatServer.url')}cgi-bin/qrcode/create?access_token=${
      global.access_token
    }`,
    {
      expire_seconds: '604800',
      action_name: 'QR_STR_SCENE',
      action_info: {
        scene: {
          scene_str: authCode,
        },
      },
    }
  );
  const { ticket } = result.data;
  const getPic = await axios({
    method: 'get',
    url: `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${encodeURI(
      ticket
    )}`,
    responseType: 'stream',
  });

  return reply(getPic.data).header('Content-Type', 'image/jpeg');
};

export const getTempList = async (request, reply) => {
  const result = await axios.get(
    `${Config.get(
      'wechatServer.url'
    )}cgi-bin/template/get_all_private_template?access_token=${
      global.access_token
    }`
  );
  const { template_list } = result.data; // eslint-disable-line camelcase
  return reply(template_list);
};
