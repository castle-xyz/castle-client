import * as Actions from '~/common/actions';

const NUM_ATTEMPTS_PER_REGION = 3;

// From https://ping.varunagw.com/script.js
async function pingAsync(address) {
  return new Promise((resolve) => {
    let startTime = Date.now();
    let image = new Image();
    image.onerror = function() {
      let endTime = Date.now();
      let timeElapsed = endTime - startTime;

      resolve(timeElapsed);
    };

    image.src = address;
  });
}

export async function reportPingsAsync() {
  try {
    let regions = await Actions.getMultiplayerRegions();
    let pings = await Promise.all(
      regions.map(async (region) => {
        let total = 0.0;
        for (let i = 0; i < NUM_ATTEMPTS_PER_REGION; i++) {
          total += await pingAsync(region.pingAddress);
        }

        return {
          region: region.name,
          ping: Math.round(total / NUM_ATTEMPTS_PER_REGION),
        };
      })
    );

    await Actions.updatePings(pings);
  } catch (e) {}
}
