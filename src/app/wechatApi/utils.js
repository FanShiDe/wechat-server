import axios from 'axios';
import Config from 'config';

/**
 * 获取 access_token
 */
const getAccessToken = () => {
  axios
    .get(
      `${Config.get(
        'wechatServer.url'
      )}cgi-bin/token?grant_type=client_credential&appid=${Config.get(
        'wechatServer.appID'
      )}&secret=${Config.get('wechatServer.appSecret')}`
    )
    .then(res => {
      const { access_token, expires_in } = res.data; // eslint-disable-line camelcase
      console.log(access_token, expires_in);
      global.access_token = access_token; // eslint-disable-line camelcase
      global.expires_in = expires_in; // eslint-disable-line camelcase
    })
    .catch(e => console.error(e));
};

/**
 * 定时获取可用的 access_token ，防止 access_token 过期导致调用 微信API 失败
 */
export const scheduler = () => {
  getAccessToken();
  setInterval(() => getAccessToken(), (global.expires_in - 2 || 7198) * 1000);
};

/**
 * 将数据转换成微信接口指定的数据格式
 * @param {*} data
 */
export const toXML = data => {
  const msg = `<xml>
    <ToUserName><![CDATA[${data.ToUserName}]]></ToUserName>
    <FromUserName><![CDATA[${data.FromUserName}]]></FromUserName>
    <CreateTime>${data.backTime}</CreateTime>
    <MsgType><![CDATA[text]]></MsgType>
    <Content><![CDATA[${data.Content}]]></Content>
    </xml>`;
  return msg;
};

/**
 * 通过用户🆔获取用户信息
 * @param {用户相对该公众号的用户🆔} openId
 */
export const getUserInfo = async openId => {
  const res = await axios.get(
    `${Config.get('wechatServer.url')}cgi-bin/user/info?access_token=${
      global.access_token
    }&openid=${openId}&lang=zh_CN`
  );
  return !res.errmsg && res.data;
};

/**
 * 使用指定的消息模版，填充具体数据，对用户组中的用户群发消息
 * @param {用户相对该公众号的用户🆔} openid
 * @param {引用消息模版🆔} subscribeTempId
 * @param {模版填充数据} result
 */
export const sendTempMsg = async (openid, subscribeTempId, result) => {
  const promiseArr = openid.map(item =>
    axios.post(
      `${Config.get(
        'wechatServer.url'
      )}cgi-bin/message/template/send?access_token=${global.access_token}`,
      {
        touser: item,
        template_id: subscribeTempId,
        data: result,
      }
    )
  );
  const res = await Promise.all(promiseArr);
  const errRes = [];
  res.forEach((item, index) => {
    if (item.errmsg !== 'ok') {
      errRes.push(openid[index]);
    }
  });

  return errRes.length !== 0;
};
