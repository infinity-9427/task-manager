// Quick test to check userService import
const { userService } = require('./src/services/userService.ts');

console.log('userService:', userService);
console.log('getAllUsers method:', userService?.getAllUsers);
console.log('typeof getAllUsers:', typeof userService?.getAllUsers);
