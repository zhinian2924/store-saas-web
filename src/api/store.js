import { api } from './index'

export const storeApi = {
  profile() {
    return api.get('/store/profile')
  },
  updateProfile(payload) {
    return api.put('/store/profile', payload)
  },
  uploadLogo(file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('scene', 'logo')
    return api.post('/store/media/images', formData)
  }
}
