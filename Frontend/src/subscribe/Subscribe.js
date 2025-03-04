
import React, { useState, useEffect, useContext } from 'react';
import {
    Button, ButtonGroup, Snackbar, Alert, Box, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Backdrop, CircularProgress, IconButton, Tooltip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from '@mui/icons-material/Edit';
import { cloneDeep } from "lodash";
import _ from "lodash";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "./Subscribe.css";

function Subscribe() {
    const [Editenable, setEditenable] = useState(false);
    const [loading, setloading] = useState(true);
    const [options, setoptions] = useState({});
    const [errorlist, seterrorlist] = useState([])
    const [roleoptions, setroleoptions] = useState([]);
    const [companyoptions, setcomapnyoptions] = useState([]);
    const [urloptions, seturloptions] = useState([]);
    const [subscribelist, setsubscribelist] = useState([]);
    const [subscribelistbkp, setsubscribelistbkp] = useState([]);

    const navigate = useNavigate();

    const [snackAlert, setsnackAlert] = useState({
        open: false,
        severity: 'success',
        msg: ''
    });

    // Existing functionality code remains unchanged
    const onChange = (event, index) => {
        const { name, value } = event.target;
        let temp = cloneDeep(subscribelist);
        temp[index][name] = value;
        if (name == 'companyName') {
            temp[index]['careerLinks'] = []
            let opt = []
            temp.forEach((item, index) => {
                if (((Object.keys(options.companies)).length > 0 && (Object.keys(options.companies)).includes(item.companyName))) {
                    opt.push(options.companies[item.companyName])
                }
                else {
                    opt.push([])
                }
            });
            seturloptions(opt)
        }
        setsubscribelist(temp);
    };

    const clear = (event, index) => {
        const { name, value } = event.target;
        let temp = cloneDeep(subscribelist);
        temp[index][name] = '';
        setsubscribelist(temp);
    };

    const onMultiSelectChange = (event, index, name) => {
        let selectedValue = event.target.value.trim();
        let temp = cloneDeep(subscribelist);
        let listcheck = []
        console.log("check the values",name,index,event)
        if (name == 'roleNames') {
            listcheck = roleoptions
        }
        else {
            listcheck = urloptions[index]
        }
        if (listcheck?.includes(selectedValue)) {
            if (temp[index][name]?.includes(selectedValue)) {
                temp[index][name] = temp[index][name].filter((role) => role !== selectedValue);
            } else {
                temp[index][name].push(selectedValue);
            }
            event.target.value = "";
            setsubscribelist(temp);
        }
    };

    const handleEnterKey = (event, index, name) => {
        if (event.key === "Enter") {
            let customValue = event.target.value.trim();
            let temp = cloneDeep(subscribelist);

            if (customValue && !temp[index][name]?.includes(customValue)) {
                temp[index][name].push(customValue);
            }

            event.target.value = "";
            setsubscribelist(temp);
            event.preventDefault();
        }
    };

    const removeTag = (index, tagIndex,name) => {
        if (Editenable) {
            let temp = cloneDeep(subscribelist);
            temp[index][name].splice(tagIndex, 1);
            setsubscribelist(temp);
        }
    };

    const validateInputs = () => {
        let temp = cloneDeep(subscribelist);
        let valid = true;
        let err = []

        temp.forEach((item, index) => {
            const companyNameErr = item.companyName === '';
            const urlErr = item.careerLinks.length === 0;
            const roleNamesErr = item.roleNames.length === 0;
            let obj = { companyNameErr: companyNameErr, urlerr: urlErr, roleNamesErr: roleNamesErr }
            err.push(obj)

            temp[index].companyNameerr = companyNameErr;
            temp[index].urlerr = urlErr;
            temp[index].roleNameserr = roleNamesErr;

            if (companyNameErr || urlErr || roleNamesErr) {
                valid = false;
            }
        });
        seterrorlist(err)

        return { valid, validatedData: temp };
    };


    const UpdateSubscriptions = async (subscribePayload) => {
        try {
            const response = await axios.put('http://localhost:8080/update-subscriptions', subscribePayload);
            return response
        } catch (error) {
            console.error('Error fetching data:', error);
            return { status: 401, msg: 'Update Failed try later' }
        }
    }

    const handleClose = () => {
        setsnackAlert({
            open: false,
            severity: '',
            msg: ''
        })
    };

    const OnDelete = async (e, index) => {
        let user = JSON.parse(localStorage.getItem('user'))

        let payload = {
            email: user.username,
            subscriptions: [subscribelist[index]['companyName']]
        }

        try {
            const response = await axios.post('http://localhost:8080/delete-subscriptions', payload);
            setsnackAlert({
                open: true,
                severity: 'success',
                msg: 'Delete Successful'
            })
        } catch (error) {
            console.error('Error fetching data:', error);
            setsnackAlert({
                open: true,
                severity: 'error',
                msg: 'Delete Failed'
            })
        }
        LoadSubscriptionData()
    }

    const OnModifyClick = async (e) => {
        if (Editenable) {
            if (!_.isEqual(subscribelist, subscribelistbkp)) {
                let user = JSON.parse(localStorage.getItem('user'))
                const { valid, validatedData } = validateInputs();

                if (valid) {
                    let payload = {
                        email: user.username,
                        subscriptions: cloneDeep(subscribelist)
                    }
                    let res = await UpdateSubscriptions(payload)

                    if (res.status == 200) {
                        setsnackAlert({
                            open: true,
                            severity: 'success',
                            msg: 'Update Successful'
                        })
                    }
                    else {
                        setsnackAlert({
                            open: true,
                            severity: 'error',
                            msg: 'Update Failed'
                        })
                    }
                    LoadSubscriptionData()
                    getoptions()
                }
                else{
                    setsubscribelist(subscribelistbkp)
                    setsnackAlert({
                        open: true,
                        severity: 'error',
                        msg: 'Invalid Data.. please try again'
                    })
                }
            }
        }
        setEditenable(!Editenable)
    };

    const LoadSubscriptionData = async () => {
        try {
            let user = JSON.parse(localStorage.getItem('user'))
            let payload = { email: user.username }
            const response = await axios.post('http://localhost:8080/fetch-user-subscriptions', payload);

            if (response.status == 200) {
                setloading(false);
                setsubscribelist(response.data.subscriptions)
                setsubscribelistbkp(response.data.subscriptions)
                let arr = []
                response.data.subscriptions.forEach((item) => {
                    arr.push({ companyNameErr: false, urlerr: false, roleNamesErr: false })
                })
                seterrorlist(arr)
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setloading(false);
            setsnackAlert({
                open: true,
                severity: 'error',
                msg: 'Failed to fetch data... Please try again'
            })
        }
    }

    const getoptions = async () => {
        try {
            let user = JSON.parse(localStorage.getItem('user'))
            let payload = { email: user.username }
            const response = await axios.get('http://localhost:8080/fetch-all-subscriptions');

            if (response.status == 200) {
                setoptions(response.data)
                setroleoptions(response.data.roles)
                setcomapnyoptions(Object.keys(response.data.companies))
                seturloptions([])
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setsnackAlert({
                open: true,
                severity: 'error',
                msg: 'Error to load the page... Please try again'
            })
        }
    }

    useEffect(() => {
        LoadSubscriptionData()
        getoptions()
    }, []);

    return (
        <div className=" main-container container-fluid p-0">
            {loading ? (
                <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={loading}
                >
                    <CircularProgress color="inherit" />
                </Backdrop>
            ) : (
                <>
                    <div className="row m-0">
                        <div className="col-md-12 p-4">
                            <div className="card shadow-sm border-0">
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-center mb-4">
                                        <h4 className="fw-bold m-0 text-primary">MANAGE YOUR SUBSCRIPTIONS</h4>
                                        <div>
                                            <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={() => { navigate("/subscribe/addsubscriptions") }}
                                                className="me-2"
                                                sx={{
                                                    backgroundColor: '#4caf50',
                                                    '&:hover': { backgroundColor: '#388e3c' },
                                                    textTransform: 'none',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                Add Subscriptions
                                            </Button>
                                            <Button
                                                variant="contained"
                                                startIcon={<EditIcon />}
                                                onClick={(e) => { OnModifyClick(e) }}
                                                sx={{
                                                    backgroundColor: Editenable ? '#ff9800' : '#2196f3',
                                                    '&:hover': { backgroundColor: Editenable ? '#f57c00' : '#1976d2' },
                                                    textTransform: 'none',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {Editenable ? "Save Changes" : "Modify"}
                                            </Button>
                                        </div>
                                    </div>

                                    <TableContainer component={Paper} elevation={0} className="border">
                                        <Table>
                                            <TableHead sx={{ backgroundColor: "#3f51b5" }}>
                                                <TableRow>
                                                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Company Name</TableCell>
                                                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Career Links</TableCell>
                                                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Job Roles</TableCell>
                                                    <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {subscribelist != null && subscribelist.length > 0 ? (
                                                    subscribelist.map((data, index) => (
                                                        <TableRow key={index} hover>
                                                            {/* Company Name Input */}
                                                            <TableCell>
                                                                <div className="position-relative">
                                                                    <input
                                                                        type="text"
                                                                        id={`companyName-${index}`} 
                                                                        name="companyName"
                                                                        list="companyName-options"
                                                                        className={`form-control ${errorlist[index]?.companyNameerr ? "is-invalid" : ""}`}
                                                                        placeholder="Select or type a company"
                                                                        value={data.companyName}
                                                                        onClick={(e) => Editenable && clear(e, index)}
                                                                        onFocus={(e) => Editenable && clear(e, index)}
                                                                        onChange={(e) => onChange(e, index)}
                                                                        disabled={!Editenable}
                                                                    />
                                                                    <datalist id="companyName-options">
                                                                        {companyoptions.map((item) => (
                                                                            <option key={item} value={item} />
                                                                        ))}
                                                                    </datalist>
                                                                </div>
                                                            </TableCell>

                                                            {/* Career Links Input */}
                                                            <TableCell>
                                                                <div className={`multi-select rounded ${data.roleNameserr ? "border-danger" : "border"}`}>
                                                                    {data.careerLinks.map((role, tagIndex) => (
                                                                        <span key={role} className="tag bg-light text-primary rounded-pill px-2 py-1 me-1 mb-1 d-inline-flex align-items-center">
                                                                            {role}
                                                                            {Editenable && (
                                                                                <span className="ms-1 cursor-pointer" onClick={() => removeTag(index, tagIndex,"careerLinks")}>
                                                                                    ×
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    ))}
                                                                    <input
                                                                        type="text"
                                                                        name='carrerLinks'
                                                                        id={`careerLinks-${index}`}
                                                                        list={`carrer-options-${index}`}
                                                                        className="multi-input border-0 flex-grow-1"
                                                                        placeholder={Editenable ? "Select or type..." : ""}
                                                                        onInput={(e) => onMultiSelectChange(e, index, "careerLinks")}
                                                                        onKeyDown={(e) => handleEnterKey(e, index, "careerLinks")}
                                                                        disabled={!Editenable}
                                                                    />
                                                                </div>
                                                                <datalist id={`carrer-options-${index}`}>
                                                                    {(urloptions[index] != undefined ? urloptions[index] : []).map((role) => (
                                                                        <option key={role} value={role} />
                                                                    ))}
                                                                </datalist>
                                                            </TableCell>

                                                            {/* Job Roles Multi-Select */}
                                                            <TableCell>
                                                                <div className={`multi-select rounded ${data.roleNameserr ? "border-danger" : "border"}`}>
                                                                    {data.roleNames.map((role, tagIndex) => (
                                                                        <span key={role} className="tag bg-light text-primary rounded-pill px-2 py-1 me-1 mb-1 d-inline-flex align-items-center">
                                                                            {role}
                                                                            {Editenable && (
                                                                                <span className="ms-1 cursor-pointer" onClick={() => removeTag(index, tagIndex,"roleNames")}>
                                                                                    ×
                                                                                </span>
                                                                            )}
                                                                        </span>
                                                                    ))}
                                                                    <input
                                                                        type="text"
                                                                        id={`roleNames-${index}`}
                                                                        list="job-roles-options"
                                                                        className="multi-input border-0 flex-grow-1"
                                                                        placeholder={Editenable ? "Select or type..." : ""}
                                                                        onInput={(e) => onMultiSelectChange(e, index, "roleNames")}
                                                                        onKeyDown={(e) => handleEnterKey(e, index, "roleNames")}
                                                                        disabled={!Editenable}
                                                                    />
                                                                </div>
                                                                <datalist id="job-roles-options">
                                                                    {roleoptions.map((role) => (
                                                                        <option key={role} value={role} />
                                                                    ))}
                                                                </datalist>
                                                            </TableCell>

                                                            {/* Action Buttons */}
                                                            <TableCell align="center">
                                                                <Tooltip title="Delete">
                                                                    <IconButton
                                                                    id={`delete-${index}`}
                                                                        color="error"
                                                                        onClick={(e) => OnDelete(e, index)}
                                                                        className="bg-light"
                                                                        disabled={!Editenable}
                                                                    >
                                                                        <DeleteIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center" className="py-5">
                                                            <div className="text-center">
                                                                <div className="text-muted mb-3">No subscriptions found</div>
                                                                <Button
                                                                    variant="contained"
                                                                    startIcon={<AddIcon />}
                                                                    onClick={() => { navigate("/subscribe/addsubscriptions") }}
                                                                    sx={{
                                                                        backgroundColor: '#4caf50',
                                                                        '&:hover': { backgroundColor: '#388e3c' }
                                                                    }}
                                                                >
                                                                    Add Your First Subscription
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Snackbar
                        open={snackAlert.open}
                        autoHideDuration={3000}
                        onClose={handleClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    >
                        <Alert
                            onClose={handleClose}
                            severity={snackAlert.severity}
                            variant="filled"
                            elevation={6}
                            sx={{ width: '100%' }}
                        >
                            {snackAlert.msg}
                        </Alert>
                    </Snackbar>
                </>
            )}
        </div>
    );
}

export default Subscribe;
