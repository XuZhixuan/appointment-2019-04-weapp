import wepy from 'wepy'

const host = 'https://appointment.eeyes.xyz/api'

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

  if (authResponse.statusCode === 201) {
    wepy.setStorageSync('access_token', authResponse.data.access_token)
    wepy.setStorageSync('access_token_expired_at', new Date().getTime() + authResponse.data.expires_in * 1000)
  }

  return authResponse
}

const refresh = async (params = {}) => {
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
    wepy.setStorageSync('access_token_expired_at', new Date().getTime() + refreshResponse.data.expires_in * 1000)
  }

  return refreshResponse
}

export default {
  request,
  login,
  refresh
}
