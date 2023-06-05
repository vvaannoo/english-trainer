import {useEffect, useState} from 'react';

const Papa = require('papaparse');

function App() {
  const [data, setData] = useState({});
  const [current, setCurrent] = useState(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // load csv file
    loadCsv().catch(console.error);

    async function loadCsv() {
      const res = await fetch('/data.csv?v=1.0');
      const csv = await res.text();
      const parsed = Papa.parse(csv, {
        delimiter: ',',
        // header: true,
        worker: false,
      });
      const map = parsed.data.slice(1).reduce((acc, [eng, geo, comment]) => {
        if (eng && geo) {
          if (!acc[geo]) {
            acc[geo] = [];
          }
          acc[geo].push({eng, geo, comment});
        }
        return acc;
      }, {});
      setData(map);
    }
  }, []);

  const next = () => {
    if (!shown && current) {
      setShown(true);
      return;
    }
    const keys = Object.keys(data);
    const size = keys.length;
    const index = Math.floor(Math.random() * size);
    const geo = keys[index];
    setCurrent(data[geo]);
    setShown(false);
  };

  return (
      <div style={{padding: '2rem'}}>
        <button style={{padding: '1rem 4rem', marginBottom: '1rem'}}
                onClick={next}>
          {
            !current ? 'Start' : shown ? 'Next' : 'Show Translation'
          }
        </button>
        {current && (
            <div>
              <h2>
                {current[0].geo}
                {current.length > 1 && ` (x${current.length})`}
              </h2>
              <hr />
              {
                  shown && (
                      <ul>
                        {current.map(({eng, comment}) => (
                            <li key={eng}>
                              <h2>{eng}</h2>
                              {comment && <em>{comment}</em>}
                            </li>
                        ))}
                      </ul>
                  )
              }
            </div>
        )}
      </div>
  );
}

export default App;
