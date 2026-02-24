import './App.css';
import { useState } from 'react';

function Table({ data }) {
    function formatDate({ data }) {
        data.forEach(job => 
        {
            <tr class="job-row">
                <td>{job.id}</td>
                <td><strong>{job.surname} {job.name}</strong><br /></td>
                <td>{job.departmentID}</td>
                <td>{job.salary.ToString("N0")} грн</td>
                <td>{job.premium.ToString("N0")} грн</td>
                <td>
                    <button class="btn btn-warning btn-sm">
                        Змінити
                    </button>
                    <button class="btn btn-danger btn-sm">
                        Видалити
                    </button>
                </td >
            </tr >
        }
        );
    }
    return (
        <div class="table-responsive">
            <table class="table table-bordered table-hover align-middle">
                <thead class="table-dark">
                    <tr>
                        <th>#</th>
                        <th>ПІБ</th>
                        <th>Відділ</th>
                        <th>Оклад</th>
                        <th>Премія</th>
                        <th>Дії</th>
                    </tr>
                </thead>
                <tbody>
                    formatDate(data);
                </tbody>
            </table >
        </div >
    );
}

function App() {
    const [data, setData] = useState([]);
    return (
        <>
            <button onClick={(e) => {
                fetch("https://localhost:7123/Doctors").then(Response => Response.json()).then(data => {
                    console.log(data);
                    setData(data);
                })
            }}>Get weather</button>
            <Table data={data} />
        </>
    );
}

export default App;
