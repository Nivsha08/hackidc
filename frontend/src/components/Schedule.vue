<template>
  <div class="container-fluid">
    <div class="container">
      <img class="herzel" src="../../static/herzel_black.png">
      <h2>Schedule</h2>
      <table class="table table-dark table-bordered table-striped">
        <thead class="thead-dark">
          <tr>
            <th colspan="12">Thursday, April 11th</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">08:00</th>
            <td>Registration & Gathering</td>
            <td>Adelson lobby</td>
          </tr>
          <tr>
            <th scope="row">09:00</th>
            <td>Opening Ceremony</td>
            <td>Auditorium EL03, Adelson building</td>
          </tr>
          <tr>
            <th scope="row">10:30</th>
            <td class="bg-success"><strong>Hacking starts!</strong></td>
            <td>Floors 1,2,3,4</td>
          </tr>
          <tr>
            <th scope="row">13:00</th>
            <td>Party & Lunch</td>
            <td>Outside</td>
          </tr>
          <tr>
            <th scope="row">17:00</th>
            <td colspan="12">Pitch workshop</td>
          </tr>
          <tr>
            <th scope="row">18:00</th>
            <td>Happy Hour!</td>
            <td>Outside</td>
          </tr>
          <tr>
            <th scope="row">19:00</th>
            <td colspan="12">Pitch Presentations Rehearsals (optional)</td>
          </tr>
          <tr>
            <th scope="row">20:00</th>
            <td>Dinner</td>
            <td>Outside</td>
          </tr>
          <tr>
            <th scope="row">21:00</th>
            <td>Party!</td>
            <td>Outside</td>
          </tr>
          <tr>
            <th scope="row">00:00</th>
            <td>Midnight Snack!</td>
            <td>Outside</td>
          </tr>
        </tbody>
      </table>
      <table class="table table-dark table-bordered table-striped">
        <thead class="thead-dark">
        <tr>
          <th colspan="12">Friday, April 12th</th>
        </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">07:00</th>
            <td>Breakfast</td>
            <td>Outside</td>
          </tr>
          <tr>
            <th scope="row">09:00</th>
            <td colspan="12" class="bg-danger"><strong>Hacking Ends - Judging</strong></td>
          </tr>
          <tr>
            <th scope="row">11:00</th>
            <td>Lunch</td>
            <td>Outside</td>
          </tr>
          <tr>
            <th scope="row">12:00</th>
            <td>Ceremony</td>
            <td>Auditorium EL03, Adelson building</td>
          </tr>
          <tr>
            <th scope="row">14:00</th>
            <td colspan="12">The End :)</td>
          </tr>
        </tbody>
      </table>
      <h5 class="text-muted"><strong>*</strong> All locations refer to Adelson School of Entrepreneurship Building</h5>
      <h5 class="text-muted"><strong>*</strong> Please note that the schedule may be subject to change</h5>
    </div>
  </div>
</template>

<script>

</script>

<style scoped>
  .container-fluid {
    margin-top: 3rem;
    padding: 8rem 0;
    min-height: 1000px;
    background-color: #f7f7f7;
  }
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .herzel {
    width: 10%;
    margin-bottom: 4rem;
  }
  h2 {
    font-weight: bold;
    text-align: center;
  }
  h5 { text-align: left; font-size: 1.1rem; }
  table {
    width: 70%;
    margin: 2rem 0 1rem 0;
  }
  th, td, tr {
    text-align: center;
    padding: .5rem 1rem;
    font-size: 1.2rem;
  }

  @media screen and (max-width: 1440px) and (min-width: 1201px) {
    .container {width: 75%;}
    th, td, tr {
      font-size: 1rem;
    }
  }

  @media screen and (max-width: 1200px) {
    .herzel {margin-bottom: 2rem;}
    h2 { margin-bottom: 1rem; }
    table {
      width: 90%;
      margin-bottom: 1rem;
    }
    th, td, tr { font-size: 1rem; }
  }

  @media screen and (max-width: 767px) {
    .herzel {width: 20%; margin-bottom: 2rem;}
    table {
      width: 95%;
      margin-bottom: 1rem;
    }
    th, td, tr {
      text-align: center;
      padding: .5rem .5rem;
      font-size: 1rem;
    }
    h5 { font-size: 1rem; padding-left: 1rem; }
  }
</style>
