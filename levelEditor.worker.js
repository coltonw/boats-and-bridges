import solver from './solver.js';

onmessage = function (e) {
  console.log('worker message recieved');
  console.log(e.data.islands[0].x);
  solver(e.data, true, false, true);
};
