import { createRouter, createWebHistory } from 'vue-router'
import { ACCOUNT_TYPE_KEY, TOKEN_KEY } from '../api'
import DefaultLayout from '../layout/DefaultLayout.vue'
import PlatformLayout from '../layout/PlatformLayout.vue'
import LoginView from '../views/LoginView.vue'
import PlatformLoginView from '../views/PlatformLoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DefaultLayout,
      meta: { requiresAuth: true, accountType: 'STORE' }
    },
    {
      path: '/platform',
      name: 'platform',
      component: PlatformLayout,
      meta: { requiresAuth: true, accountType: 'PLATFORM' }
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true, accountType: 'STORE' }
    },
    {
      path: '/platform/login',
      name: 'platform-login',
      component: PlatformLoginView,
      meta: { guestOnly: true, accountType: 'PLATFORM' }
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guestOnly: true }
    }
  ]
})

// 路由守卫
router.beforeEach((to) => {
  const loggedIn = Boolean(localStorage.getItem(TOKEN_KEY))
  const accountType = localStorage.getItem(ACCOUNT_TYPE_KEY)
  const targetAccountType = to.meta.accountType

  if (to.meta.requiresAuth && !loggedIn) {
    return { name: targetAccountType === 'PLATFORM' ? 'platform-login' : 'login' }
  }

  if (to.meta.requiresAuth && targetAccountType && accountType !== targetAccountType) {
    return { name: targetAccountType === 'PLATFORM' ? 'platform-login' : 'login' }
  }

  if (to.meta.guestOnly && loggedIn) {
    if (targetAccountType && accountType !== targetAccountType) {
      return true
    }
    return { name: targetAccountType === 'PLATFORM' ? 'platform' : 'home' }
  }

  return true
})

export default router
