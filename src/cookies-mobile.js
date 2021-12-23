import CookieManager from '@react-native-cookies/cookies';

// https://www.quirksmode.org/js/cookies.html

export default {
  set: function (name, value, ttl, domain) {
    let expires = "";
    let cookieDomain = "";
    if (ttl) {
      let date = new Date();
      date.setTime(date.getTime() + (ttl * 60 * 1000));
      expires = date.toGMTString();
    }
    if (domain) {
      cookieDomain = "; domain=" + domain;
    }
    console.log("set name : ",name)
    console.log("set value : ",value)
    console.log("set ttl : ",ttl)
    console.log("set domain : ",domain)

    // set a cookie
    return CookieManager.set('https://'+domain, {
      name: name,
      value: escape(value),
      domain: domain,
      path: '/',
      version: '1',
      expires: expires
    }).then((done) => {
      console.log('CookieManager.set =>', JSON.stringify({
        name: name,
        value: escape(value),
        domain: cookieDomain,
        path: '/',
        version: '1',
        expires: expires
      }));
    }).catch((error)=>{    console.log("set error : ",error)
  });

    // document.cookie = name + "=" + escape(value) + expires + cookieDomain + "; path=/; samesite=lax";
  },
  get: function (name, domain) {
    let i, c;
    let nameEQ = name + "=";
    return CookieManager.get(domain)
      .then((cookies) => {
        return cookies[name]
      });

  }
};
