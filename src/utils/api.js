import wepy from 'wepy'

const host = 'https://app0.eeyes.xyz/api'

const request = async (options, showLoading = true) => {
  if (typeof options === 'string') {
    options = {
      url: options
    }
  }

  if (showLoading) {
    wepy.showLoading({title: '加载中'})
  }

  options.url = host + '/' + options.url
  let response = await wepy.request(options)

  if (showLoading) {
    wepy.hideLoading()
  }

  if (response.statusCode === 500) {
    wepy.showModal({
      title: '错误',
      content: '服务器错误，请联系管理员或重试'
    })
  }

  return response
}

const login = async (params = {}) => {
  let loginData = await wepy.login()

  params.code = loginData.code

  let authResponse = await request({
    url: 'authorizations',
    data: params,
    method: 'POST'
  })

  console.log(authResponse)

  if (authResponse.statusCode === 201) {
    wepy.setStorageSync('access_token', authResponse.data.access_token)
    wepy.setStorageSync('access_token_expires_at', new Date().getTime() + authResponse.data.expires_at * 1000)
  }

  return authResponse
}

const refreshToken = async (params = {}) => {
  let accessToken = wepy.getStorageSync('access_token')

  let refreshResponse = await request({
    url: 'authorizations/current',
    header: {
      'Authorization': 'Bearer' + accessToken
    },
    method: 'PUT'
  })

  if (refreshResponse.statusCode === 200) {
    wepy.setStorageSync('access_token', refreshResponse.data.access_token)
    wepy.setStorageSync('access_token_expires_at', new Date().getTime() + refreshResponse.data.expires_in * 1000)
  }

  return refreshResponse
}

const getToken = async (options) => {
  // 从缓存中取出 Token
  let accessToken = wepy.getStorageSync('access_token')
  let expiredAt = wepy.getStorageSync('access_token_expires_at')

  // 如果 token 过期了，则调用刷新方法
  if (accessToken && new Date().getTime() > expiredAt) {
    let refreshResponse = await refreshToken(accessToken)

    // 刷新成功
    if (refreshResponse.statusCode === 200) {
      accessToken = refreshResponse.data.access_token
    } else {
      // 刷新失败了，重新调用登录方法，设置 Token
      let authResponse = await login()
      if (authResponse.statusCode === 201) {
        accessToken = authResponse.data.access_token
      }
    }
  }

  return accessToken
}

const authRequest = async (options, showLoading = true) => {
  if (typeof options === 'string') {
    options = {
      url: options
    }
  }
  // 获取Token
  let accessToken = await getToken()

  // 将 Token 设置在 header 中
  let header = options.header || {}
  header.Authorization = 'Bearer ' + accessToken
  options.header = header

  return request(options, showLoading)
}

export default {
  request,
  login,
  refreshToken,
  authRequest
}
