import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import TimelineView from '../views/TimelineView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/lib'
    },
    {
      path: '/lib',
      name: 'lib',
      component: HomeView
    }, {
      path: '/timeline',
      name: 'timeline',
      component: TimelineView
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
    , {
      path: '/upload',
      name: 'upload',
      component: () => import('../views/UploadView.vue')
    },
  ]
})

export default router
