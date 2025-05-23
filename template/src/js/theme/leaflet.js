import { leaftletPoints as points } from '../data/data';

const { L } = window;

/* -------------------------------------------------------------------------- */
/*                                   leaflet                                  */
/* -------------------------------------------------------------------------- */

const leafletInit = () => {
  const mapContainer = document.getElementById('map');
  if (L && mapContainer) {
    const getFilterColor = () => {
      return window.config.config.phoenixTheme === 'dark'
        ? [
            'invert:98%',
            'grayscale:69%',
            'bright:89%',
            'contrast:111%',
            'hue:205deg',
            'saturate:1000%'
          ]
        : ['bright:101%', 'contrast:101%', 'hue:23deg', 'saturate:225%'];
    };
    const tileLayerTheme =
      'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer.colorFilter(tileLayerTheme, {
      attribution: null,
      transparent: true,
      filter: getFilterColor()
    });

    const map = L.map('map', {
      center: L.latLng(25.659195, 30.182691),
      zoom: 0.6,
      layers: [tiles],
      minZoom: 1.4
    });

    const mcg = L.markerClusterGroup({
      chunkedLoading: false,
      spiderfyOnMaxZoom: false
    });

    points.map(point => {
      const { name, location, street } = point;
      const icon = L.icon({
        iconUrl: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABkAAAApCAYAAADAk4LOAAAACXBIWXMAAAFgAAABYAEg2RPaAAADpElEQVRYCZ1XS1LbQBBtybIdiMEJKSpUqihgEW/xDdARyAnirOIl3MBH8NK7mBvkBpFv4Gy9IRSpFIQiRPyNfqkeZkY9HwmFt7Lm06+7p/vN2MmyDIrQ6QebALAHAD4AbFuWfQeAAACGs5H/w5jlsJJw4wMA+GhMFuMA99jIDJJOP+ihZwDQFmNuowWO1wS3viDXpdEdZPEc0odruj0EgN5s5H8tJOEEX8R3rbkMtcU34NTqhe5nSQTJ7Tkk80s6/Gk28scGiULguFBffgdufdEwWoQ0uoXo8hdAlooVH0REjISfwZSlyHGh0V5n6aHAtKTxXI5g6nQnMH0P4bEgwtR18Yw8Pj8QZ4ARUAI0Hl+fQZZGisGEBVwHr7XKzox57DXZ/ij8Cdwe2u057z9/wygOxRl4S2vSUHx1oucaMQGAHTrgtdag9mK5aN+Wx/uAAQ9Zenp/SRce4TpaNbQK4+sTcGqeTB/aIXv3XN5oj2VKqii++U0JunpZ8urxee4hvjqVc2hHpBDXuKKT9XMgVYJ1/1fPGSeaikzgmWWkMIi9bVf8UhotXxzORn5gWFchI8QyttlzjS0qpsaIGY2MMsujV/AUSdcY0dDpB6/EiOPYzclR1CI5mOez3ekHvrFLxa7cR5pTscfrXjk0Vhm5V2PqLUWnH3R5GbPGpMVD7E1ckXesKBQ7AS/vmQ1c0+kHuxpBj98lTCm8pbc5QRJRdZ6qHb/wGryXq3Lxszv+5gySuwvxueXySwYvHEjuQ9ofTGKYlrmK1EsCHMd5SoD7mZ1HHFCBHLNbMEshvrugqWLn01hpVVJhFgVGkDvK7hR6n2B+d9C7xsqWsbkqHv4cCsWezEb+o2SR+SFweUBxfA5wH7kShjKt2vWL57Px3GhIFEezkb8pxvUWHYhotAfCk2AtkEcxoOttrxUWDR5svb1emSQKj0WXK1HYIgFREbiBqmoZcB2RkbE+byMZiosorVgAZF1ID7yQhEs38wa7nUqNDezdlavC2HbBGSQkGgZ8uJVBmzeiKCRRpEa9ilWghORVeGB7BxeSKF5xqbFBkxBrFKUk/JHA7ppENQaCnCjthK+3opCEYyANztXmZN858cDYWSUSHk3A311GAZDvo6deNKUk1EsqnJoQlkYBNlmxQZeaMgmxoUokICoHDce351RCCiuKoirJWEgNOYvQplM2VCLhUqF7jf94rW9kHVUjQeheV4riv0i4ZOzzz/2y/+0KAOAfr4EE4HpCFhwAAAAASUVORK5CYII=`
      });
      const marker = L.marker([point.lat, point.long], {
        icon
      });
      const popupContent = `
        <h6 class="mb-1">${name}</h6>
        <p class="m-0 text-body-quaternary">${street}, ${location}</p>
      `;
      const popup = L.popup({ minWidth: 180 }).setContent(popupContent);
      marker.bindPopup(popup);
      mcg.addLayer(marker);
      return true;
    });
    map.addLayer(mcg);

    const themeController = document.body;
    themeController.addEventListener(
      'clickControl',
      ({ detail: { control, value } }) => {
        if (control === 'phoenixTheme') {
          tiles.updateFilter(
            value === 'dark'
              ? [
                  'invert:98%',
                  'grayscale:69%',
                  'bright:89%',
                  'contrast:111%',
                  'hue:205deg',
                  'saturate:1000%'
                ]
              : ['bright:101%', 'contrast:101%', 'hue:23deg', 'saturate:225%']
          );
        }
      }
    );
  }
};

export default leafletInit;
