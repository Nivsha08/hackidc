import Vue from "vue";
import Vuex from "vuex";
import axios from "axios";

Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    authenticated: false,
    user: {
      registerStatus: ""
    },
    loading: false,
    registration: "opened" // valid values: 'under-construction' ,'opened' or 'closed'
  },
  getters: {
    isLoading: state => state.loading,
    isRegistrationOpen: state => state.registration,
    isAuthenticated: state => state.authenticated,
    getUser: state => state.user,
    isSignedUp: state => state.authenticated && state.user.registerStatus !== "pending"
  },
  mutations: {
    setLoading: (state, payload) => (state.loading = payload),
    setRegistrationStatus: (state, payload) => (state.registration = payload),
    authenticate: (state, payload) => {
      state.authenticated = true;
      state.user = { ...payload };
    },
    signout: state => {
      state.user = {};
      state.authenticated = false;
    },
    updateUserObject: (state, payload) => {
      state.user = { ...payload };
    }
  },
  actions: {
    loadingStart: context => {
      context.commit("setLoading", true);
    },
    loadingEnd: context => {
      context.commit("setLoading", false);
    },
    registrationOpened: context => {
      context.commit("setRegistrationStatus", "opened");
    },
    registrationClosed: context => {
      context.commit("setRegistrationStatus", "closed");
    },
    signIn: (context, payload) => {
      context.commit("authenticate", payload);
    },
    signOut: context => {
      context.commit("signout");
    },
    updateUser: context => {
      axios.get("/api/users/self", { withCredentials: true })
        .then(res => {
          context.commit("updateUserObject", res.data);
        })
        .catch(err => {
          console.log(err);
        });
    }
  }
});
