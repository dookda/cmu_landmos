import { useState } from 'react'
import { Navbar } from './components/Navbar/Navbar'
import Map from './components/Map/Map'
import { Chart } from './components/Chart/Chart'
import { Layers } from './components/Layers/Layers'

import './App.css'
import Footer from './components/Footer/Footer'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <h1 className="text-center">Mapbox with React</h1>
        <p className="text-center">This is a simple example of using Mapbox with React.</p>

        <div className="row">
          <div className="col-sm-6 mt-3">
            <Map />
          </div>
          <div className="col-sm-6 mt-3">
            <div className="layer-panel">
              <Layers />
              <Layers />
              <Layers />
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12 mt-3">
            <Chart />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12 mt-3">
            <Chart />
          </div>
        </div>

        <div className="row">
          <div className="col-sm-12 mt-3">
            <Chart />
          </div>
        </div>

      </div>
      <Footer />
    </>
  )
}

export default App
