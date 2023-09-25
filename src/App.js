import {useCallback, useEffect, useState} from 'react';

const version = '2.6';
const Papa = require('papaparse');

function App() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState({});
  const [sources, setSources] = useState({});
  const [selectedSources, setSelectedSources] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [shown, setShown] = useState(false);
  const [history, setHistory] = useState([]);

  const extractSources = useCallback((data) => {
    const sources = {};
    data.forEach(([, , , source]) => {
      const safeSource = getSafeSource(source);
      if (!(safeSource in sources)) {
        sources[safeSource] = 0;
      }
      sources[safeSource]++;
    });
    return sources;
  }, []);

  const filterData = useCallback((data, selectedSources) => {
    if (!selectedSources.length) {
      selectedSources = Object.keys(sources);
    }
    const map = data.reduce((acc, [eng, geo, comment, source]) => {
      if (!selectedSources.includes(getSafeSource(source))) {
        return acc;
      }
      if (eng && geo) {
        if (!acc[geo]) {
          acc[geo] = [];
        }
        acc[geo].push({eng, geo, comment, source: getSafeSource(source)});
      }
      return acc;
    }, {});
    setFiltered(map);
  }, [sources]);

  useEffect(() => {
    // load csv file
    loadCsv().catch(console.error);

    async function loadCsv() {
      const res = await fetch(`./data.csv?v=${version}`);
      const csv = await res.text();
      const parsed = Papa.parse(csv, {
        delimiter: ',',
        // header: true,
        worker: false,
      });
      const data = parsed.data.slice(1);
      setData(data);
      const sources = extractSources(data);
      setSources(sources);
      setSelectedSources(Object.keys(sources));
    }
  }, [extractSources]);

  useEffect(() => {
    filterData(data, selectedSources);
  }, [selectedSources, data, filterData]);

  function getSafeSource(source) {
    return source || 'vano';
  }

  const next = () => {
    if (!shown && history.length) {
      setShown(true);
      return;
    }
    const keys = Object.keys(filtered);
    const size = keys.length;
    const index = Math.floor(Math.random() * size);
    const geo = keys[index];
    // setCurrent(filtered[geo]);
    setHistory((prev) => [...prev, filtered[geo]]);
    setCurrentIndex((prev) => prev + 1);
    setShown(false);
  };
  const prev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const sourceChangeHandler = (event) => {
    const {name: source, checked} = event.target;
    if (checked) {
      setSelectedSources([...selectedSources, source]);
    } else {
      setSelectedSources(selectedSources.filter(s => s !== source));
    }
  };

  const current = history[currentIndex];

  return (
      <div style={{padding: '2rem'}}>
        <div className="sources">
          {Object.entries(sources).map(([source, count]) => (
              <label key={source} className="source-checkbox">
                <input type="checkbox"
                       name={source}
                       checked={selectedSources.includes(source)}
                       onChange={sourceChangeHandler}/>
                {source} ({count})
              </label>
          ))}
        </div>

        {current && (
            <div>
              <h2>
                {current[0].geo}
                {current.length > 1 && ` (x${current.length})`}
              </h2>
              <hr/>
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

        <div className="btn-group">
          <button className="back-btn"
                  disabled={currentIndex < 1}
                  onClick={prev}>
            Prev
          </button>
          <button className="main-btn"
                  onClick={next}>
            {
              !current ? 'Start' : shown ? 'Next' : 'Show'
            }
          </button>
          <button className="placeholder-btn"></button>
        </div>
      </div>
  );
}

export default App;
