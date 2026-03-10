import { useState, useEffect, useCallback } from 'react';
import { data, replace, Route, Routes, useNavigation, navigate } from 'react-router';

const API = 'https://localhost:7134/Users';

function IndexPage()
{
  return(
    <>
      <h1>Index</h1>
    </>
  );
}

function LoginPage()
{
  const navigate = useNavigation();
  useEffect(() => {
    if(localStorage.getItem("token") != null)
    {
      navigate("/", {replace: true});
    }
  })
  function onSubmit(e)
  {
    e.preventDefault();
    let credentials = {
      "email": document.getElementById("userEmail").value,
      "password": document.getElementById("userPassword").value,
    }
    console.log(credentials)
    fetch(`${API}/login`, {
      method:"POST",
      body: JSON.stringify(credentials),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => response.text()).then(data => {
      console.log(data);
      localStorage.setItem("token", data)
    }).catch(err=>{console.error(err)})
  }

  return(
    <>
      <h1>Login</h1>
      <form action="" method='POST' onSubmit={onSubmit}>
        <input id='userEmail' type='email' placeholder='E-male' />
        <input id='userPassword' type='password' placeholder='password' />
        <button type='submit'>Увійти</button>
      </form>
    </>
  );
}

export default function App() {
  
  return (
    <>
      <Routes>
        <Route path='/' element={<IndexPage />}></Route>
        <Route path='/login' element={<LoginPage />}></Route>
      </Routes>
    </>
  );
}
