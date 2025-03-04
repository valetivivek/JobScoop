import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { cloneDeep } from 'lodash';
import {
    Button,
    IconButton,
    TextField,
    Typography,
    Box,
    Paper,
    Stack,
    Snackbar,
    Alert,
    Chip,
    Backdrop,
    CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import './Subscribe.css'

function AddSubscriptions() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const [subscribelist, setSubscribelist] = useState([
        {
            companyName: "",
            careerLinks: [],
            roleNames: [],
            companyNameerr: false,
            urlerr: false,
            roleNameserr: false
        },
        {
            companyName: "",
            careerLinks: [],
            roleNames: [],
            companyNameerr: false,
            urlerr: false,
            roleNameserr: false
        },
        {
            companyName: "",
            careerLinks: [],
            roleNames: [],
            companyNameerr: false,
            urlerr: false,
            roleNameserr: false
        }
    ]);

    const [options, setOptions] = useState({});
    const [roleOptions, setRoleOptions] = useState([]);
    const [companyOptions, setCompanyOptions] = useState([]);
    const [urlOptions, setUrlOptions] = useState([]);
    const [snackAlert, setSnackAlert] = useState({
        open: false,
        severity: 'success',
        msg: ''
    });


    const onAddItem = () => {
        let temp = cloneDeep(subscribelist);
        temp.push({
            companyName: "",
            careerLinks: [],
            roleNames: [],
            companyNameerr: false,
            urlerr: false,
            roleNameserr: false
        });
        setSubscribelist(temp);
    };


    const onRemoveItem = (index) => {
        let temp = cloneDeep(subscribelist);
        temp.splice(index, 1);
        setSubscribelist(temp);
    };


    const onChange = (event, index) => {
        const { name, value } = event.target;
        let temp = cloneDeep(subscribelist);
        temp[index][name] = value;

        if (name === 'companyName') {
            temp[index]['careerLinks'] = [];
            let opt = [];

            temp.forEach((item) => {
                if (Object.keys(options.companies || {})?.includes(item.companyName)) {
                    opt.push(options.companies[item.companyName]);
                } else {
                    opt.push([]);
                }
            });

            setUrlOptions(opt);
        }

        setSubscribelist(temp);
    };
    const clear = (event, index) => {
        const { name } = event.target;
        let temp = cloneDeep(subscribelist);
        temp[index][name] = '';
        setSubscribelist(temp);
    };




    const onMultiSelectChange = (event, index, name) => {
        let selectedValue = event.target.value.trim();
        let temp = cloneDeep(subscribelist);
        let listcheck = []
        let err = ''
        if (name == 'roleNames') {
            listcheck = roleOptions
            err = 'roleNameserr'
        }
        else {
            listcheck = urlOptions[index]
            err = 'urlerr'

        }
        console.log('check check', index, name, selectedValue, temp)
        if (listcheck?.includes(selectedValue)) {
            if (temp[index][name]?.includes(selectedValue)) {
                temp[index][name] = temp[index][name].filter((role) => role !== selectedValue);
            } else {
                temp[index][name].push(selectedValue);
            }
            event.target.value = "";
            temp[index][err] = false
            setSubscribelist(temp);
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
            let err = ''
            if (name == 'roleNames') {
                err = 'roleNameserr'
            }
            else {
                err = 'urlerr'
            }
            temp[index][err] = false
            setSubscribelist(temp);
            event.preventDefault();
        }
    };
    const removeTag = (index, tagIndex, fieldName) => {
        let temp = cloneDeep(subscribelist);
        temp[index][fieldName].splice(tagIndex, 1);
        setSubscribelist(temp);
    };

    const validateInputs = () => {
        let temp = cloneDeep(subscribelist);
        let valid = true;


        temp = temp.filter((item) => (
            item.companyName !== '' ||
            item.careerLinks.length > 0 ||
            item.roleNames.length > 0
        ));


        temp.forEach((item, index) => {
            const companyNameErr = item.companyName === '';
            const urlErr = item.careerLinks.length === 0;
            const roleNamesErr = item.roleNames.length === 0;

            temp[index].companyNameerr = companyNameErr;
            temp[index].urlerr = urlErr;
            temp[index].roleNameserr = roleNamesErr;

            if (companyNameErr || urlErr || roleNamesErr) {
                valid = false;
            }
        });

        return { valid, validatedData: temp };
    };

    // Fetch options from API
    const getOptions = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/fetch-all-subscriptions');

            if (response.status === 200) {
                setOptions(response.data);
                setRoleOptions(response.data.roles || []);
                setCompanyOptions(Object.keys(response.data.companies || {}));
                setUrlOptions([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setSnackAlert({
                open: true,
                severity: 'error',
                msg: 'Error loading data. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    // Save subscriptions
    const saveSubscriptions = async (subscribePayload) => {
        try {
            setLoading(true);
            const response = await axios.post('http://localhost:8080/save-subscriptions', subscribePayload);
            return response;
        } catch (error) {
            console.error('Error saving subscriptions:', error);
            return { status: 500, data: { message: 'Failed to save subscriptions' } };
        } finally {
            setLoading(false);
        }
    };

    // Handle alert close
    const handleClose = () => {
        setSnackAlert({
            ...snackAlert,
            open: false
        });
    };

    const onSubmit = async () => {
        const { valid, validatedData } = validateInputs();
        setSubscribelist(validatedData);
        if (valid && validatedData.length > 0) {
            try {
                const user = JSON.parse(localStorage.getItem('user')) || {};
                const subscribePayload = {
                    "email": user.username || '',
                    "subscriptions": cloneDeep(validatedData)
                };

                const response = await saveSubscriptions(subscribePayload);

                if (response.status === 200) {
                    setSnackAlert({
                        open: true,
                        severity: 'success',
                        msg: response.data.message || 'Subscriptions saved successfully!'
                    });

                    // Reset form
                    setSubscribelist([
                        {
                            companyName: "",
                            careerLinks: [],
                            roleNames: [],
                            companyNameerr: false,
                            urlerr: false,
                            roleNameserr: false
                        },
                        {
                            companyName: "",
                            careerLinks: [],
                            roleNames: [],
                            companyNameerr: false,
                            urlerr: false,
                            roleNameserr: false
                        },
                        {
                            companyName: "",
                            careerLinks: [],
                            roleNames: [],
                            companyNameerr: false,
                            urlerr: false,
                            roleNameserr: false
                        }
                    ]);
                } else {
                    setSnackAlert({
                        open: true,
                        severity: 'error',
                        msg: 'Failed to save subscriptions. Please try again.'
                    });
                }
            } catch (error) {
                setSnackAlert({
                    open: true,
                    severity: 'error',
                    msg: 'An error occurred. Please try again.'
                });
            }
        }
    };

    // Load options on component mount
    useEffect(() => {
        getOptions();
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
                <Box sx={{ p: 4 }}>
                    <Paper
                        elevation={0}
                        className="shadow-sm border-0"
                        sx={{
                            p: 3,
                            mb: 3,
                            borderRadius: 1
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <IconButton
                                    onClick={() => navigate('/subscribe')}
                                    sx={{ bgcolor: 'rgba(0,0,0,0.05)', mr: 1 }}
                                >
                                    <ArrowBackIcon />
                                </IconButton>
                                <Typography variant="h5" className="fw-bold text-primary">
                                    ADD NEW SUBSCRIPTIONS
                                </Typography>
                            </Stack>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={onSubmit}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: 'bold',
                                    bgcolor: '#2196f3',
                                    '&:hover': { bgcolor: '#1976d2' }
                                }}
                            >
                                Save Subscriptions
                            </Button>
                        </Box>

                        <Box sx={{ mb: 3 }}>
                            {subscribelist.map((data, index) => (
                                <Paper
                                    key={index}
                                    elevation={0}
                                    className="shadow-sm border"
                                    sx={{
                                        mb: 2,
                                        p: 2,
                                        borderRadius: 1
                                    }}
                                >
                                    <Stack
                                        direction={{ xs: 'column', md: 'row' }}
                                        spacing={2}
                                        alignItems={{ xs: 'flex-start', md: 'center' }}
                                    >
                                        {/* Company Name Field */}
                                        <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                Company Name
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                id={`companyName-${index}`}
                                                name="companyName"
                                                size="small"
                                                placeholder="Select or type a company name"
                                                value={data.companyName}
                                                onClick={(e) => clear(e, index)}
                                                onFocus={(e) => clear(e, index)}
                                                onChange={(e) => onChange(e, index)}
                                                error={data.companyNameerr}
                                                helperText={data.companyNameerr ? "Company name is required" : ""}
                                                InputProps={{
                                                    inputProps: {
                                                        list: "companyName-options"
                                                    }
                                                }}
                                            />
                                            <datalist id="companyName-options">
                                                {companyOptions.map((item) => (
                                                    <option key={item} value={item} />
                                                ))}
                                            </datalist>
                                        </Box>

                                        {/* Career URLs Field */}
                                        <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                Career URLs
                                            </Typography>
                                            <Box
                                                sx={{
                                                    border: '1px solid',
                                                    borderColor: data.urlerr ? 'error.main' : 'grey.300',
                                                    borderRadius: 1,
                                                    p: 1,
                                                    minHeight: '56px',
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 0.5,
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {data.careerLinks.map((url, tagIndex) => (
                                                    <Chip
                                                        key={tagIndex}
                                                        label={url}
                                                        size="small"
                                                        onDelete={() => removeTag(index, tagIndex, "careerLinks")}
                                                        color="primary"
                                                        sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                    />
                                                ))}
                                                <TextField
                                                    id={`careerLinks-${index}`}
                                                    variant="standard"
                                                    size="small"
                                                    InputProps={{ disableUnderline: true }}
                                                    placeholder={data.careerLinks.length ? "" : "Select or type URLs..."}
                                                    sx={{
                                                        ml: 0.5,
                                                        flexGrow: 1,
                                                        "& .MuiInputBase-input": {
                                                            p: 0.5
                                                        }
                                                    }}
                                                    inputProps={{
                                                        list: `career-options-${index}`
                                                    }}
                                                    onInput={(e) => onMultiSelectChange(e, index, "careerLinks")}
                                                    onKeyDown={(e) => handleEnterKey(e, index, "careerLinks")}
                                                />
                                            </Box>
                                            {data.urlerr && (
                                                <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
                                                    At least one career URL is required
                                                </Typography>
                                            )}
                                            <datalist id={`career-options-${index}`}>
                                                {(urlOptions[index] || []).map((url) => (
                                                    <option key={url} value={url} />
                                                ))}
                                            </datalist>
                                        </Box>

                                        {/* Role Names Field */}
                                        <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                Job Roles
                                            </Typography>
                                            <Box
                                                sx={{
                                                    border: '1px solid',
                                                    borderColor: data.roleNameserr ? 'error.main' : 'grey.300',
                                                    borderRadius: 1,
                                                    p: 1,
                                                    minHeight: '56px',
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 0.5,
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {data.roleNames.map((role, tagIndex) => (
                                                    <Chip
                                                        key={tagIndex}
                                                        label={role}
                                                        size="small"
                                                        onDelete={() => removeTag(index, tagIndex, "roleNames")}
                                                        color="success"
                                                        sx={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                    />
                                                ))}
                                                <TextField
                                                    id={`roleNames-${index}`}
                                                    variant="standard"
                                                    size="small"
                                                    InputProps={{ disableUnderline: true }}
                                                    placeholder={data.roleNames.length ? "" : "Select or type roles..."}
                                                    sx={{
                                                        ml: 0.5,
                                                        flexGrow: 1,
                                                        "& .MuiInputBase-input": {
                                                            p: 0.5
                                                        }
                                                    }}
                                                    inputProps={{
                                                        list: "job-roles-options"
                                                    }}
                                                    onInput={(e) => onMultiSelectChange(e, index, "roleNames")}
                                                    onKeyDown={(e) => handleEnterKey(e, index, "roleNames")}
                                                />
                                            </Box>
                                            {data.roleNameserr && (
                                                <Typography variant="caption" color="error" sx={{ ml: 1.5 }}>
                                                    At least one job role is required
                                                </Typography>
                                            )}
                                            <datalist id="job-roles-options">
                                                {roleOptions.map((role) => (
                                                    <option key={role} value={role} />
                                                ))}
                                            </datalist>
                                        </Box>

                                        {/* Row Controls */}
                                        <Box sx={{
                                            width: { xs: '100%', md: '10%' },
                                            display: 'flex',
                                            justifyContent: { xs: 'flex-end', md: 'center' },
                                            mt: { xs: 1, md: 0 }
                                        }}>
                                            <Stack direction="row" spacing={1}>
                                                <IconButton
                                                    color="error"
                                                    onClick={() => onRemoveItem(index)}
                                                    disabled={subscribelist.length <= 1}
                                                    size="small"
                                                    sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}
                                                >
                                                    <RemoveIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="primary"
                                                    onClick={onAddItem}
                                                    size="small"
                                                    sx={{ bgcolor: 'rgba(0,0,0,0.05)' }}
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                            </Stack>
                                        </Box>
                                    </Stack>
                                </Paper>
                            ))}
                        </Box>

                        {/* Add Row Button */}
                        <Box className='box-design'>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={onAddItem}
                                sx={{ textTransform: 'none' }}
                            >
                                Add Another Row
                            </Button>
                        </Box>
                    </Paper>

                    <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mt: 3 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={onSubmit}
                            fullWidth
                            sx={{
                                textTransform: 'none',
                                fontWeight: 'bold',
                                p: 1.5,
                                bgcolor: '#2196f3',
                                '&:hover': { bgcolor: '#1976d2' }
                            }}
                        >
                            Save Subscriptions
                        </Button>
                    </Box>
                </Box>
            )}

            {/* Alert */}
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
        </div>
    );
}

export default AddSubscriptions;