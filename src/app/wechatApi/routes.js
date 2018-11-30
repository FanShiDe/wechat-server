import xml2js from 'xml2js';
import * as controller from './controller';

exports.register = (server, options, next) => {
  server.route([
    {
      method: 'get',
      path: '/api/wechat/mainEntry',
      config: {
        auth: false,
        tags: ['api', 'wechatApi'],
        description: '验证消息来自微信',
        handler: controller.wechatAuth,
      },
    },
    {
      method: 'post',
      path: '/api/wechat/mainEntry',
      config: {
        auth: false,
        pre: [
          {
            method: (request, reply) => {
              xml2js.parseString(
                request.payload,
                { explicitArray: false },
                (err, json) => reply(json)
              );
            },
            assign: 'toXML',
          },
        ],
        tags: ['api', 'wechatApi'],
        description: '通过此接口可以得到微信发送的所有消息',
        handler: { async: controller.userBind },
      },
    },
    {
      method: 'get',
      path: '/api/wechat/generateQRCode/{authCode}',
      config: {
        auth: false,
        tags: ['api', 'wechatApi'],
        description: '生成带参二维码',
        handler: { async: controller.generateQRCode },
      },
    },
    {
      method: 'get',
      path: '/api/wechat/tempList',
      config: {
        tags: ['api', 'wechatApi'],
        description: '得到所有的消息模板',
        handler: { async: controller.getTempList },
      },
    },
  ]);

  return next();
};

exports.register.attributes = {
  name: 'wechat-api-route',
};
