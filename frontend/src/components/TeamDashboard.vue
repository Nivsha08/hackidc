<template>
    <div class="container-fluid">
        <div v-if="this.$store.getters.isAuthenticated" class="side-nav">
            <ul>
                <router-link class="dropdown-item mainNav-item" tag="li" :to="{ name: 'user-dashboard' }"
                             active-class="active" exact><span class="fas fa-user"></span> My Profile
                </router-link>
                <router-link class="dropdown-item mainNav-item" tag="li"
                             :to="{ name: 'team-dashboard', params: { codeNumber: user.team.codeNumber } }"
                             active-class="active" exact><span class="fas fa-users"></span> My Team
                </router-link>
            </ul>
        </div>
        <div class="main-view">
            <div class="dashboard-header">
                <span class="fas fa-users fa-4x"></span>
                <div class="dashboard-username">
                    <h2>Team {{ team.codeName | nameFormatter }}</h2>
                    <h5>team number: <strong class="text-info">{{ user.team.codeNumber }}</strong>
                        <span v-if="team.classRoom">,&nbsp;class room:
                          <strong class="text-info">{{ user.team.classRoom }}</strong>
                      </span>
                    </h5>
                </div>
            </div>
            <hr>
            <div class="dashboard-body">
                <div v-if="user.role === 'TeamBuilder' && user.registerStatus === 'approved'" class="form-group rsvpdiv">
                    <h3>Please RSVP below</h3>
                    <button @click="update_RSVP" id="rsvp" :disabled="user.team.isRSVP"
                            :class="{'btn-success': user.team.isRSVP, 'btn-warning': !user.team.isRSVP}"
                            class="btn btn-md">
                        {{(user.team.isRSVP) ? "RSVP was sent for HackIDC" : "Click here to RSVP for HackIDC !"}}
                    </button>
                    <br/>
                    <small class="text-muted">* Only groups which clicked the RSVP button will enter the contest</small>
                    <br/><br/>
                    <button @click="update_prehackRSVP" :disabled="user.team.isPreHackRSVP" class="btn btn-md"
                            :class="{'btn-success': user.team.isPreHackRSVP, 'btn-warning': !user.team.isPreHackRSVP}">
                        {{(user.team.isPreHackRSVP) ? "RSVP was sent for PreHack" : "Click here to RSVP for PreHack"}}
                    </button>
                    <br/>
                    <small class="text-muted">* At least 2 representative from the team will attend the event</small>
                    <hr/>
                </div>
                <TeamChallengePicker v-if="user.role === 'TeamBuilder' && user.registerStatus === 'approved'" :team="team" />
                <h3>Description</h3>
                <p class="description">{{ team.description }}</p>
                <div class="section" v-if="this.$store.getters.isAuthenticated">
                    <button @click="toggleEdit" v-if="!editArea && team.description" class="btn btn-sm btn-info">
                        <strong>Edit the team information</strong></button>
                    <transition mode="out-in" enter-active-class="animated fadeIn">
                        <div v-if="editArea || !team.description">
                            <hr>
                            <div class="form-group">
                                <label for="bio-edit">Edit your team description:</label>
                                <textarea class="form-control" id="bio-edit" rows="4"
                                          placeholder="Edit your Description..."
                                          v-model="newDescription"></textarea>
                                <small class="text-muted">Your team description should include a few words about
                                    yourselves and about your idea for HackIDC 2019.
                                </small>
                            </div>
                            <div class="form-group">
                                <label>If you think you'll need any technological hardware, please check it's box down
                                    below.</label>
                                <div class="hardware-wrapper">
                                    <div class="form-check" v-for="(o, i) in hardwareOptions" :key="i">
                                        <input class="form-check-input" type="checkbox" :id="'id-'+o.val" :value="o.val"
                                               v-model="newRequiredEquipment">
                                        <label class="form-check-label" :for="'id-'+o.val">{{ o.name }}</label>
                                    </div>
                                </div>
                                <small>* Please note that this <strong>does not</strong> guarantee anything at this
                                    time.
                                </small>
                                <small>** For other equipment, please contact us specifically.</small>
                            </div>
                            <button @click="editDes_done" class="btn btn-sm btn-success">Done</button>
                            <button v-if="team.description" @click="editDes_cancel" class="btn btn-sm btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </transition>
                </div>
                <h5>Team Members:</h5>
                <br>
                <div class="team-members-wrapper">
                    <div class="team-member" v-for="m in team.users" :key="m.id">
                        <a :href="'/users/' + m.id" target="_blank">
                            <div class="team-member-thumbnail-wrapper">
                                <img v-if="!m.userPicture"
                                     src="https://hairo.e.f1v.co/wp-content/themes/romisa/images/placeholder.jpg"
                                     class="img-responsive">
                                <img v-else :src="m.userPicture" class="img-responsive">
                            </div>
                            <h5>{{ m.name | nameFormatter }}</h5>
                        </a>
                    </div>
                </div>
            </div>

        </div>
    </div>
</template>

<script>
  import TeamChallengePicker from "./TeamChallengePicker"
  import linkedInIntegration from "../assets/linkedInIntegration";
  import hardwareList from "../assets/hardware_list";
  import filters from "../assets/filters";
  import axios from "axios";

  export default {
    components: {
      TeamChallengePicker
    },
    mixins: [linkedInIntegration, filters, hardwareList],
    data() {
      return {
        editFlag: false,
        newDescription: "",
        newRequiredEquipment: []
      };
    },
    computed: {
      user() {
        return this.$store.getters.getUser;
      },
      team() {
        return this.user.team;
      },
      equipment() {
        return this.user.team.requiredEquipment;
      },
      editArea() {
        return this.editFlag;
      }
    },
    methods: {
      toggleEdit() {
        this.editFlag = !this.editFlag;
      },
      editDes_cancel() {
        this.newDescription = "";
        this.editFlag = !this.editFlag;
      },
      editDes_done() {
        this.editFlag = false;
        axios.patch("/api/teams/self",
          {
            team: {
              description: this.newDescription,
              requiredEquipment: this.newRequiredEquipment
            }
          })
          .then(res => {
            this.$store.dispatch("updateUser", res.data);
          })
          .catch(err => {
            console.log(err);
          });
      },
      update_isRSVP_API(method) {
        let action, rsvpFlag;
        if (method === "rsvp") {
          action = "rsvp";
          rsvpFlag = this.isRSVP;
        } else {
          action = "prehackRsvp";
          rsvpFlag = this.isPrehackRSVP;
        }

        return axios.post(`/api/teams/self/${action}`, { rsvp: true }).then(res => {
          this.$store.dispatch("updateUser", res.data);
        }).catch(err => {
          console.log(err);
        });
      },
      update_RSVP() {
        return this.update_isRSVP_API("rsvp");
      },
      update_prehackRSVP() {
        return this.update_isRSVP_API("prehackRsvp");
      }
    },
    created() {
      this.authRequest();
    },
    mounted() {
      this.newRequiredEquipment = !this.equipment ? [] : this.equipment;
      this.isPrehackRSVP = false;
      this.isRSVP = false;
    }
  };
</script>

<style src="../assets/dashboard.css" scoped>
</style>