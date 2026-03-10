import { useState, useEffect, useCallback } from 'react';
import { data, replace, Route, Routes, useNavigate, navigate, useLocation } from 'react-router';

const API = 'https://localhost:7134/Users';

function IndexPage()
{
  const navigate = useNavigate()
  useEffect(() => {
    const token = localStorage.getItem("token");
    if(token == null)
    {
      navigate("/login", {replace: true});
    }
    else{
      fetch(`${API}/me`, {
        method:"GET",
        headers: { "Authorization": `Bearer ${token}` }
      }).then(response => {
        if (response.status === 401)
        {
          localStorage.removeItem("token");
          navigate("/login", {replace: true})
        }
      })
    }
  })


  return(
    <>
      <h1>Index</h1>
    </>
  );
}

function LoginPage()
{
  const navigate = useNavigate()
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
      localStorage.setItem("token", data);
      navigate("/", {replace: true});
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

function RegistrationPage()
{
  const navigate = useNavigate()
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
      "id": 0,
      "name": document.getElementById("userName").value,
      "email": document.getElementById("userEmail").value,
      "passwordHash": document.getElementById("userPassword").value,
      "birthday": document.getElementById("userBirthday").value,
      "gender": document.getElementById("userGender").value,
    }
    console.log(credentials)
    fetch(`${API}/register`, {
      method:"POST",
      body: JSON.stringify(credentials),
      headers: {
        "Content-Type": "application/json"
      }
    }).then(response => {
      if (response.status === 200)
        navigate("/login", {replace: true})})
    // .then(data => {
    //   console.log(data);
    //   // localStorage.setItem("token", data);
    //   // navigate("/", {replace: true});
    //   if (data.status === 200)
    //     navigate("/login", {replace: true})})
    .catch(err=>{console.error(err)})
  }

  return(
    <>
      <h1>Register</h1>
      <form action="" method='POST' onSubmit={onSubmit}>
        <input id='userName' type='text' placeholder='Name' />
        <input id='userEmail' type='email' placeholder='E-male' />
        <input id='userPassword' type='password' placeholder='password' />
        <input id='userBirthday' type="date" />
        <select id='userGender'>
          <option value="male">male</option>
          <option value="female">female</option>
        </select>
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
        <Route path='/register' element={<RegistrationPage />}></Route>
      </Routes>
    </>
  );
}
